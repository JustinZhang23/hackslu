"""Gemini adapter.
Provides functions used by the application:
 - generate_words_from_topic(topic) -> list of {"word", "clue"}
 - group_terms_with_ai(terms_with_context) -> list of {"term", "answer"}
 - generate_words_from_file(file_bytes, mime_type) -> list of {"word", "clue"}
This module calls Google Gemini via the `google-generativeai` SDK. It
requests the model to emit strict JSON and attempts to parse the response.
Environment variables used:
 - GEMINI_API_KEY: Standard Gemini API key
 - GEMINI_MODEL: model id to use (default: gemini-2.5-flash)
"""
from typing import List, Dict
import os
import json
import tempfile
try:
    import google.generativeai as genai
except ImportError:
    genai = None
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
def _init_gemini():
    if genai is None:
        raise RuntimeError("google-generativeai is not installed. Add it to requirements.txt")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = os.getenv("VITE_GEMINI_API_KEY") # Fallback to old frontend name
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is missing.")
    genai.configure(api_key=api_key)
def _get_model():
    _init_gemini()
    return genai.GenerativeModel(MODEL_NAME)
def _predict_text(prompt: str) -> str:
    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text
        # Clean off any markdown wrappers
        text = text.replace("```json", "").replace("```", "").strip()
        return text
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise
def generate_words_from_topic(topic: str) -> List[Dict]:
    """Call Vertex AI (Gemini) to generate words and clues as JSON.
    Environment requirements:
    - Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON
    - Optionally set GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION
    Returns list of {"word","clue"}.
    """
    prompt = f"""
    Generate 10 crossword words and short clues about {topic}.
    Return exactly a JSON array of objects with the form:
    [{{"word": "...", "clue": "..."}}, ...]
    The "word" must be a single continuous string of uppercase English letters (A-Z) with NO spaces or punctuation.
    The "clue" should be a clear, concise definition or hint.
    DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.
    """
    try:
        text = _predict_text(prompt)
        parsed = json.loads(text)
        if isinstance(parsed, list):
            # Normalize keys
            out = []
            for it in parsed:
                w = it.get("word") if isinstance(it, dict) else None
                c = it.get("clue") if isinstance(it, dict) else None
                if w:
                    out.append({"word": w.strip(), "clue": (c or "").strip()})
            return out
    except Exception as e:
        print(f"Gemini API error in generate_words_from_topic: {e}")
        print("Falling back to hardcoded computing clues...")
        pass
    # Fallback: return a higher quality mock list related to computing
    return [
        {"word": "CPU", "clue": "The central processing unit, the brain of the computer"},
        {"word": "CODE", "clue": "Instructions written in a programming language"},
        {"word": "PYTHON", "clue": "A popular high-level programming language used for AI"},
        {"word": "GEMINI", "clue": "Google's powerful multimodal AI model"},
        {"word": "SOFTWARE", "clue": "Programs and other operating information used by a computer"},
    ]
def group_terms_with_ai(terms_with_context: List[Dict]) -> List[Dict]:
    """Ask Gemini to provide answers/definitions for extracted terms.
    Input: list of {"term","slide","context"}
    Output: list of {"term","answer"}
    """
    lines = []
    for t in terms_with_context[:50]:
        term = t.get("term")
        ctx = t.get("context", "")
        lines.append(f"- {term} : {ctx}")
    prompt = f"""
    For each item below, provide a concise answer/definition. Return exactly a JSON array
    of objects with fields: {{"term": string, "answer": string}} and nothing else.
    DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.
    Input:
    {"\n".join(lines)}
    """
    try:
        text = _predict_text(prompt)
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    # Fallback mapping
    out = []
    for t in terms_with_context[:20]:
        term = t.get("term") if isinstance(t, dict) else str(t)
        out.append({"term": term, "answer": f"Gemini mock answer for {term}"})
    return out
def generate_words_from_file(file_bytes: bytes, mime_type: str, file_name: str = "") -> List[Dict]:
    """Pass a file (image, pdf, pptx) directly to Gemini for multimodal extraction.
    Returns list of {"word","clue"}.
    """
    prompt = """
    Analyze the attached document or image.
    Extract the main concepts and generate 10 crossword words and short clues about these concepts.
    Return exactly a JSON array of objects with the form:
    [{"word": "...", "clue": "..."}]
    The "word" must be a single continuous string of uppercase English letters (A-Z) with NO spaces or punctuation.
    The "clue" should be a clear, concise definition or hint based on the document.
    DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.
    """
    try:
        model = _get_model()
        
        # Gemini often requires file uploads for complex documents like PPTX
        # So we write to a temporary file locally and upload it using the File API
        tmp_path = ""
        uploaded_file = None
        try:
            ext = os.path.splitext(file_name)[1] if file_name else ""
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
            # Upload the file to Gemini
            uploaded_file = genai.upload_file(tmp_path, mime_type=mime_type)
            
            response = model.generate_content([
                uploaded_file,
                prompt
            ])
        finally:
            # Clean up local file
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            # Clean up remote file
            if uploaded_file:
                genai.delete_file(uploaded_file.name)
        text = response.text
        text = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)
        if isinstance(parsed, list):
            out = []
            for it in parsed:
                w = it.get("word") if isinstance(it, dict) else None
                c = it.get("clue") if isinstance(it, dict) else None
                if w:
                    out.append({"word": w.strip().upper(), "clue": (c or "").strip()})
            return out
    except Exception as e:
        print(f"Gemini API error for file upload: {e}")
        pass
    return [
        {"word": "MOCKFILE", "clue": f"Mock clue for {mime_type}"},
        {"word": "MULTIMODAL", "clue": "Another mock file clue"},
    ]