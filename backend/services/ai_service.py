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
    from services.gemini_adapter import generate_words_from_topic as _gen_words, group_terms_with_ai as _group_terms
except Exception:
    _gen_words = None
    _group_terms = None


def generate_words_from_topic(topic: str) -> List[Dict]:
    """Return a list of {"word":"..","clue":".."} using Gemini.

    Falls back to a mock if the gemini adapter is not available.
    """
    if callable(_gen_words):
        return _gen_words(topic)

    topic = topic or "topic"
    return [
        {"word": "example", "clue": f"Example clue about {topic}"},
        {"word": "sample", "clue": f"Sample clue about {topic}"},
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
