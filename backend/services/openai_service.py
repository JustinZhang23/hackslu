"""OpenAI helper (kept for reference).

This module historically contained helpers that used the OpenAI SDK to ask a model
to group slide-extracted terms and produce concise answers/definitions. The current
project uses Gemini (Vertex AI) by default; this file is retained for reference and
provides a single helper `group_terms_with_ai` when an OpenAI client is configured.

Public functions:
 - group_terms_with_ai(terms_with_context)

Notes:
 - If you want to enable OpenAI usage, set OPENAI_API_KEY and add the OpenAI SDK
   to the environment.
"""

import os
from dotenv import load_dotenv

load_dotenv()

def group_terms_with_ai(terms_with_context):
    """Ask the AI to group/format terms with answers.

    Input: list of dicts like {"term": "foo", "context": "..."}
    Output: list of dicts {"term": <str>, "answer": <str>} - best-effort.

    If no real client is configured, returns a simple mock pairing.
    """
    # Mock fallback when no API key
    # (Note: this module does not configure an OpenAI client by default in this repo.)
    out = []
    for t in terms_with_context[:10]:
        term = t.get("term") if isinstance(t, dict) else str(t)
        out.append({"term": term, "answer": f"Definition or answer for {term}"})
    return out