"""AI adapter - Gemini (Vertex AI) integration.

This module provides a stable interface used by the application:
 - generate_words_from_topic(topic) -> [{"word","clue"}, ...]
 - group_terms_with_ai(terms_with_context) -> [{"term","answer"}, ...]

It delegates to `services.gemini_adapter`. If the adapter is not available, the
functions return small mocked responses to allow local development without
access to Vertex AI.

Environment variables used (see gemini_adapter for details):
 - GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION
 - GEMINI_MODEL
"""

import os
from typing import List, Dict

try:
    from services.gemini_adapter import (
        generate_words_from_topic as _gen_words,
        group_terms_with_ai as _group_terms,
        generate_words_from_file as _gen_words_file,
    )
except Exception:
    _gen_words = None
    _group_terms = None
    _gen_words_file = None


def generate_words_from_topic(topic: str) -> List[Dict]:
    """Return a list of {"word":"..","clue":".."} using Gemini.

    Falls back to a mock if the gemini adapter is not available.
    """
    if callable(_gen_words):
        return _gen_words(topic)

    topic = topic or "topic"
    return [
        {"word": "REACT", "clue": "A JavaScript library for building user interfaces"},
        {"word": "COMPONENT", "clue": "An independent, reusable piece of a UI"},
        {"word": "STATE", "clue": "An object that holds information that may change over the lifecycle"},
        {"word": "PROPS", "clue": "Inputs to a React component"},
        {"word": "HOOKS", "clue": "Functions that let you 'hook into' React state and lifecycle features"},
        {"word": "EFFECT", "clue": "A Hook that lets you perform side effects in function components"},
        {"word": "RENDER", "clue": "The process of generating the UI from the component state and props"},
    ]


def group_terms_with_ai(terms_with_context: List[Dict]) -> List[Dict]:
    """Return list of {"term":..., "answer":...} using Gemini.

    Falls back to a mock if the gemini adapter is not available.
    """
    if callable(_group_terms):
        return _group_terms(terms_with_context)

    out = []
    for t in terms_with_context[:20]:
        term = t.get("term") if isinstance(t, dict) else str(t)
        out.append({"term": term, "answer": f"Mock answer for {term}"})
    return out


def generate_words_from_file(file_bytes: bytes, mime_type: str, file_name: str = "") -> List[Dict]:
    """Pass an image/pdf/pptx directly to Gemini and extract concepts.

    Falls back to a mock if the gemini adapter is not available.
    """
    if callable(_gen_words_file):
        return _gen_words_file(file_bytes, mime_type, file_name)

    return [
        {"word": "REACT", "clue": "A JavaScript library for building user interfaces"},
        {"word": "COMPONENT", "clue": "An independent, reusable piece of a UI"},
        {"word": "STATE", "clue": "An object that holds information that may change over the lifecycle"},
        {"word": "PROPS", "clue": "Inputs to a React component"},
        {"word": "HOOKS", "clue": "Functions that let you 'hook into' React state and lifecycle features"},
        {"word": "EFFECT", "clue": "A Hook that lets you perform side effects in function components"},
        {"word": "RENDER", "clue": "The process of generating the UI from the component state and props"},
    ]
