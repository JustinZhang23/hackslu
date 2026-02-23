import { GoogleGenerativeAI } from '@google/generative-ai';
import JSZip from 'jszip';
import { ExtractedWord } from './generator';

// Extracts pure text and first few images from PPTX
async function extractFromPPTX(file: File) {
    try {
        const zip = await JSZip.loadAsync(file);
        let textContent = "";

        // Parse slide texts carefully
        const slideFiles = Object.keys(zip.files).filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/));
        for (const slideName of slideFiles) {
            const slideXml = await zip.files[slideName].async("string");
            const matches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
            if (matches) {
                for (const match of matches) {
                    const text = match.replace(/<[^>]+>/g, '').trim();
                    if (text) textContent += text + " ";
                }
            }
        }

        // Parse images for OCR, clip at 10 to avoid payload bloat
        const imageFiles = Object.keys(zip.files)
            .filter(name => name.match(/^ppt\/media\/image\d+\.(png|jpeg|jpg)$/i))
            .slice(0, 10);

        const imageParts = [];
        for (const imageName of imageFiles) {
            const imageData = await zip.files[imageName].async("base64");
            const mimeType = imageName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            imageParts.push({ inlineData: { data: imageData, mimeType } });
        }

        return { textContent, imageParts };
    } catch (err: any) {
        console.error("PPTX ZIP parsing failed:", err);
        throw new Error("Unable to read the PPTX file structure. Is it corrupted?");
    }
}

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            if (base64) resolve(base64);
            else reject(new Error("Failed to parse base64"));
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(file);
    });
}

export async function extractCrosswordData(file: File): Promise<ExtractedWord[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
        throw new Error('Missing VITE_GEMINI_API_KEY in environment. Please add it to your .env file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Flash is the fast, free, multimodal workhorse
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Extract distinct concepts or terms from this uploaded document/image and create a crossword puzzle list.
    Return ONLY a raw JSON array of objects with exactly two keys: "word" and "clue".
    The "word" must be a single continuous string of uppercase English letters (A-Z) with NO spaces or punctuation.
    The "clue" should be a clear, concise definition or hint.
    Aim for 8 to 15 important words. 
    Strict instruction: DO NOT wrap the response in markdown blocks like \`\`\`json. Output standard JSON array text ONLY.
  `;

    let parts: any[] = [{ text: prompt }];

    const name = file.name || '';
    const isPPTX = name.toLowerCase().endsWith('.pptx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    if (isPPTX) {
        const { textContent, imageParts } = await extractFromPPTX(file);
        if (!textContent && imageParts.length === 0) {
            throw new Error("Could not find any readable text or images in this presentation.");
        }
        parts.push({ text: `Extracted Text from Slides:\n${textContent}\n\nBelow are relevant slide images:` });
        parts = parts.concat(imageParts);
    } else {
        // Treat as PDF or Image
        const b64 = await fileToBase64(file);
        parts.push({
            inlineData: {
                data: b64,
                mimeType: file.type || "application/pdf"
            }
        });
    }

    try {
        const result = await model.generateContent(parts);
        const responseText = result.response.text() || '';

        // Purge any hidden markdown fencing to enforce strict JSON parsing
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const arr = JSON.parse(cleanedText);

        if (!Array.isArray(arr) || arr.length === 0) {
            throw new Error("AI returned an empty list.");
        }

        return arr.map(item => ({
            word: (item.word || '').toUpperCase().replace(/[^A-Z]/g, ''),
            clue: item.clue || 'No clue provided'
        })).filter(w => w.word.length > 0);

    } catch (error: any) {
        console.error("Gemini Extraction Error:", error);
        throw new Error(error.message || "Failed to process the document via AI.");
    }
}

export async function generateFromTopic(topic: string): Promise<ExtractedWord[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('Missing VITE_GEMINI_API_KEY in environment.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a trivia and crossword expert. Generate a crossword puzzle word list about the topic: "${topic}".

Use your knowledge (as if summarizing a Wikipedia article) to pick 10 to 15 important, specific terms related to this topic.
Each word must be a single continuous string of uppercase English letters (A-Z) with NO spaces, hyphens, or punctuation.
Each clue should be concise, clear, and suitable for a crossword — not too easy, not too cryptic.

Return ONLY a raw JSON array with objects having exactly two keys: "word" and "clue".
Strict instruction: DO NOT wrap the response in markdown or \`\`\`json blocks. Output standard JSON array text ONLY.`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text() || '';
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const arr = JSON.parse(cleanedText);

        if (!Array.isArray(arr) || arr.length === 0) {
            throw new Error("AI returned an empty list.");
        }

        return arr.map((item: any) => ({
            word: (item.word || '').toUpperCase().replace(/[^A-Z]/g, ''),
            clue: item.clue || 'No clue provided'
        })).filter((w: ExtractedWord) => w.word.length > 1);

    } catch (error: any) {
        console.error("Topic generation error:", error);
        throw new Error(error.message || "Failed to generate crossword from topic.");
    }
}

export async function getHint(word: string, originalClue: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('Missing VITE_GEMINI_API_KEY in environment.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are helping a student who is stuck on a crossword puzzle clue.
The answer to the clue is: "${word}"
The original clue is: "${originalClue}"

Write a MUCH more direct hint. Be specific and concrete:
- State the field or category this concept belongs to (e.g. "This is a term in biology/law/computer science/etc.")
- Describe one very specific, identifying property or function of the answer
- If helpful, give a short real-world example or analogy

Do NOT use vague phrases like "it relates to" or "it involves". Do NOT include the word "${word}" itself.
Keep it to 2 sentences max. Output ONLY the hint text, no labels or extra formatting.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error: any) {
        throw new Error(error.message || "Failed to generate hint.");
    }
}
