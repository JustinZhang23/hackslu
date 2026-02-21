"""Application entrypoint.

This module creates the FastAPI `app` instance and includes the API router
defined in `app.py`. Start the server with e.g.:

    uvicorn backend.main:app --reload

Exports:
 - app: FastAPI instance
"""

from fastapi import FastAPI
from app import router

app = FastAPI()

app.include_router(router)


@app.get("/")
def root():
    return {"message": "Crossword API is running"}