"""API router for crossword functionality.

Provides endpoints:
 - GET /crossword/{topic}?use_ai=true - generate a crossword, optionally using the AI provider
 - POST /slides/group - upload a PPTX and return AI-grouped term/answer pairs

This router is included by `backend.main`.
"""

from fastapi import APIRouter, HTTPException
from services.crossword_generator import generate_crossword
from services import ai_service
from pydantic import BaseModel
from typing import List, Dict, Optional
import base64

router = APIRouter()


class CrosswordRequest(BaseModel):
    # Accept either a topic string or a base64 pptx file
    topic: Optional[str] = None
    file_base64: Optional[str] = None
    mime_type: Optional[str] = None
    file_name: Optional[str] = None


@router.post("/crossword")
def create_crossword(req: CrosswordRequest):
    """Generate a crossword puzzle.

    Accepts either:
    - {"topic": "biology"}
    - {"file_base64": "<base64 encoded PPTX/PDF image>"}
    
    Returns the fully formed crossword grid, across clues, and down clues.
    """
    if req.file_base64:
        # Extract candidates directly using Gemini multimodality
        try:
            contents = base64.b64decode(req.file_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 in file_base64: {e}")
            
        mtype = req.mime_type or ""
        fname = req.file_name or ""
        
        if not mtype and fname.lower().endswith(".pptx"):
            mtype = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            
        # Send file bytes directly to Gemini Multimodal
        formatted_words = ai_service.generate_words_from_file(contents, mtype, fname)

    elif req.topic:
        # Generate words from topic via Gemini
        formatted_words = ai_service.generate_words_from_topic(req.topic)
    else:
        raise HTTPException(status_code=400, detail="Request must include 'topic' or 'file_base64'")

    # Lay out the crossword
    puzzle_layout = generate_crossword(formatted_words)
    
    if "error" in puzzle_layout:
        raise HTTPException(status_code=500, detail=puzzle_layout["error"])

    return puzzle_layout