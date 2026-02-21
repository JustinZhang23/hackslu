"""API router for crossword functionality.

Provides endpoints:
 - GET /crossword/{topic}?use_ai=true - generate a crossword, optionally using the AI provider
 - POST /slides/group - upload a PPTX and return AI-grouped term/answer pairs

This router is included by `backend.main`.
"""

from fastapi import APIRouter, HTTPException
from services.crossword_generator import generate_crossword
from services import slide_parser, ai_service
from pydantic import BaseModel
from typing import List, Dict, Optional
import base64

router = APIRouter()


@router.get("/crossword/{topic}")
def get_crossword(topic: str, use_ai: bool = False):
    """Return crossword data for a topic.

    If use_ai=true and an AI client is configured, ask the AI for words/clues and format
    them into the same structure as the non-AI generator.
    """
    # Use AI path when requested
    if use_ai:
        words = ai_service.generate_words_from_topic(topic)
        # words expected as list of {"word":..., "clue":...}
        crossword_data = []
        row_position = 0
        for w in words:
            word_text = w.get('word') or w.get('word', '')
            clue = w.get('clue') or w.get('clue', '')
            crossword_data.append({
                "word": word_text.upper(),
                "clue": clue,
                "row": row_position,
                "col": 0,
                "direction": "across"
            })
            row_position += 2

        return {"topic": topic.lower(), "grid_size": row_position, "words": crossword_data}

    # Fallback to the built-in generator
    return generate_crossword(topic)


class SlideGroupRequest(BaseModel):
    # Either provide a base64-encoded pptx file bytes, or pre-extracted terms
    file_base64: Optional[str] = None
    terms: Optional[List[Dict]] = None


@router.post("/slides/group")
def group_slides(req: SlideGroupRequest):
    """Accept JSON to group slide terms.

    JSON body options:
    - {"file_base64": "<base64-pptx>"}  -> parser will extract terms from pptx
    - {"terms": [{"term":..., "slide":..., "context":...}, ...]} -> use provided terms

    Returns: {"terms": [{"term":"...","answer":"..."}, ...]}
    """
    if req.file_base64:
        try:
            contents = base64.b64decode(req.file_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 in file_base64: {e}")
        terms = slide_parser.extract_terms(contents)
    elif req.terms is not None:
        terms = req.terms
    else:
        raise HTTPException(status_code=400, detail="Request must include 'file_base64' or 'terms' in JSON body")

    grouped = ai_service.group_terms_with_ai(terms)
    return {"terms": grouped}