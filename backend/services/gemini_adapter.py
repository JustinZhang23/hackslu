"""Gemini (Vertex AI) adapter.

Provides two functions used by the application:
 - generate_words_from_topic(topic) -> list of {"word", "clue"}
 - group_terms_with_ai(terms_with_context) -> list of {"term", "answer"}

This module calls Google Vertex AI via the `google-cloud-aiplatform` SDK. It
requests the model to emit strict JSON and attempts to parse the response. If
the SDK is not installed or the request/parse fails, the functions return a
small, deterministic mock list to keep the app usable during development.

Environment variables used:
 - GOOGLE_APPLICATION_CREDENTIALS: path to GCP service account JSON (required for real calls)
 - GOOGLE_CLOUD_PROJECT: GCP project id (optional; aiplatform can infer it)
 - GOOGLE_CLOUD_LOCATION: Vertex AI location (default: us-central1)
 - GEMINI_MODEL: model id to use (default: text-bison@001)

For production/testing with Vertex AI:
 1. Create a service account with Vertex AI permissions and download a JSON key.
 2. Set GOOGLE_APPLICATION_CREDENTIALS to the key path and (optionally) PROJECT/LOCATION.
 3. Install dependencies: `pip install google-cloud-aiplatform`
"""

from typing import List, Dict
import os
import json

try:
    from google.cloud import aiplatform
except Exception:
    aiplatform = None


MODEL_NAME = os.getenv("GEMINI_MODEL", "text-bison@001")
PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")


def _init_aiplatform():
    if aiplatform is None:
        raise RuntimeError("google-cloud-aiplatform is not installed. Add it to requirements.txt")
    # aiplatform.init is idempotent
    if PROJECT:
        aiplatform.init(project=PROJECT, location=LOCATION)
    else:
        aiplatform.init(location=LOCATION)


def _get_model():
    _init_aiplatform()
    return aiplatform.TextGenerationModel.from_pretrained(MODEL_NAME)


def _predict_text(prompt: str, max_output_tokens: int = 512) -> str:
    try:
        model = _get_model()
        response = model.predict(prompt, max_output_tokens=max_output_tokens)
        # response may expose .text or be a simple string depending on SDK
        if hasattr(response, "text"):
            return response.text
        return str(response)
    except Exception as e:
        # propagate or return empty
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
    Return the answer as a JSON array of objects with the form:
    [{{"word": "...", "clue": "..."}}, ...]
    and nothing else.
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
    except Exception:
        # fall through to a safe mock
        pass

    # Fallback: return a simple mock list
    topic = topic or "topic"
    return [
        {"word": "gemini_example", "clue": f"Gemini example clue about {topic}"},
        {"word": "gemini_sample", "clue": f"Gemini sample clue about {topic}"},
    ]


def group_terms_with_ai(terms_with_context: List[Dict]) -> List[Dict]:
    """Ask Gemini to provide answers/definitions for extracted terms.

    Input: list of {"term","slide","context"}
    Output: list of {"term","answer"}
    """
    # Build prompt with context, but careful about token size
    lines = []
    for t in terms_with_context[:50]:
        term = t.get("term")
        ctx = t.get("context", "")
        lines.append(f"- {term} : {ctx}")

    prompt = f"""
    For each item below, provide a concise answer/definition. Return exactly a JSON array
    of objects with fields: {{"term": string, "answer": string}} and nothing else.

    Input:
    {"\n".join(lines)}
    """

    try:
        text = _predict_text(prompt, max_output_tokens=1024)
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
