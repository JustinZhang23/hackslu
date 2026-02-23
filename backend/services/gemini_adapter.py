"""Gemini adapter.
Provides functions used by the application:
 - generate_words_from_topic(topic) -> list of {"word", "clue"}
 - group_terms_with_ai(terms_with_context) -> list of {"term", "answer"}
 - generate_words_from_file(file_bytes, mime_type) -> list of {"word", "clue"}

Uses the `google-genai` SDK (the current, supported version).
Environment variables:
 - GEMINI_API_KEY: Your Gemini API key
 - GEMINI_MODEL: Model ID to use (default: gemini-flash-latest)
"""
from typing import List, Dict
import os
import json
import io

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-flash-latest")


def _get_client():
    if genai is None:
        raise RuntimeError("google-genai is not installed. Run: pip install google-genai")
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is missing.")
    return genai.Client(api_key=api_key)


def _predict_text(prompt: str) -> str:
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    text = response.text
    text = text.replace("```json", "").replace("```", "").strip()
    return text


def _parse_word_list(text: str) -> List[Dict]:
    """Parse a JSON array of {word, clue} objects from a Gemini response string."""
    parsed = json.loads(text)
    if not isinstance(parsed, list):
        return []
    out = []
    for it in parsed:
        w = it.get("word") if isinstance(it, dict) else None
        c = it.get("clue") if isinstance(it, dict) else None
        if w:
            out.append({"word": w.strip().upper(), "clue": (c or "").strip()})
    return out


def generate_words_from_topic(topic: str) -> List[Dict]:
    """Call Gemini to generate crossword words and clues for a topic."""
    prompt = f"""
    Generate 10 crossword words and short clues about {topic}.
    Return exactly a JSON array of objects with the form:
    [{{"word": "...", "clue": "..."}}]
    The "word" must be a single continuous string of uppercase English letters (A-Z) with NO spaces or punctuation.
    The "clue" should be a clear, concise definition or hint.
    DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.
    """
    try:
        text = _predict_text(prompt)
        out = _parse_word_list(text)
        if out:
            return out
    except Exception as e:
        print(f"Gemini API error in generate_words_from_topic: {e}")

    return [
        {"word": "CPU", "clue": "The central processing unit, the brain of the computer"},
        {"word": "CODE", "clue": "Instructions written in a programming language"},
        {"word": "PYTHON", "clue": "A popular high-level programming language used for AI"},
        {"word": "GEMINI", "clue": "Google's powerful multimodal AI model"},
        {"word": "SOFTWARE", "clue": "Programs and other operating information used by a computer"},
    ]


def group_terms_with_ai(terms_with_context: List[Dict]) -> List[Dict]:
    """Ask Gemini to provide answers/definitions for extracted terms."""
    lines = [f"- {t.get('term')} : {t.get('context', '')}" for t in terms_with_context[:50]]
    prompt = f"""
    For each item below, provide a concise answer/definition. Return exactly a JSON array
    of objects with fields: {{"term": string, "answer": string}} and nothing else.
    DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.
    Input:
    {chr(10).join(lines)}
    """
    try:
        text = _predict_text(prompt)
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass

    return [{"term": t.get("term") if isinstance(t, dict) else str(t),
             "answer": f"Gemini mock answer for {t.get('term') if isinstance(t, dict) else str(t)}"}
            for t in terms_with_context[:20]]


_FILE_PROMPT = """
Analyze the attached document or image.
Extract the main concepts and generate 10 crossword words and short clues about these concepts.
Return exactly a JSON array of objects with the form:
[{"word": "...", "clue": "..."}]
The "word" must be a single continuous string of uppercase English letters (A-Z) with NO spaces or punctuation.
The "clue" should be a clear, concise definition or hint based on the document.
DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.
"""


def generate_words_from_file(file_bytes: bytes, mime_type: str, file_name: str = "") -> List[Dict]:
    """Extract crossword words from a file using Gemini.

    Strategy (fastest first):
      1. PPTX → extract text locally with python-pptx, send as plain text prompt (no API upload)
      2. Images / PDF → send bytes inline in the request (no upload round-trip, same as old SDK)
    """
    is_pptx = (
        file_name.lower().endswith(".pptx")
        or mime_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )

    # ── 1. Fast PPTX path: local text extraction ──────────────────────────────
    if is_pptx:
        try:
            from pptx import Presentation

            prs = Presentation(io.BytesIO(file_bytes))
            slide_texts = []
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        slide_texts.append(shape.text.strip())

            combined_text = "\n".join(slide_texts[:200])
            prompt = f"""
            Below is text extracted from a presentation.
            Extract the main concepts and generate 10 crossword words and short clues about these concepts.
            Return exactly a JSON array of objects with the form:
            [{{"word": "...", "clue": "..."}}]
            The "word" must be a single continuous string of uppercase English letters (A-Z) with NO spaces or punctuation.
            The "clue" should be a clear, concise definition or hint based on the presentation content.
            DO NOT wrap the response in markdown blocks like ```json. Output standard JSON array text ONLY.

            Presentation text:
            {combined_text}
            """
            text = _predict_text(prompt)
            out = _parse_word_list(text)
            if out:
                return out
        except Exception as e:
            print(f"PPTX text extraction error, trying inline image: {e}")

    # ── 2. Fast inline path: send bytes directly (images, PDFs, fallback) ─────
    # This is equivalent to what the old google.generativeai SDK did — no separate
    # upload step, bytes go straight in the request body.
    try:
        client = _get_client()
        image_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[image_part, _FILE_PROMPT],
        )
        text = response.text.replace("```json", "").replace("```", "").strip()
        out = _parse_word_list(text)
        if out:
            return out
    except Exception as e:
        print(f"Gemini inline file error: {e}")

    return [
        {"word": "MOCKFILE", "clue": f"Mock clue for {mime_type}"},
        {"word": "MULTIMODAL", "clue": "Another mock file clue"},
    ]