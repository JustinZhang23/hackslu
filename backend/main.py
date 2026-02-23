"""Application entrypoint.

This module creates the FastAPI `app` instance and includes the API router
defined in `app.py`. Start the server with e.g.:

    uvicorn backend.main:app --reload

Exports:
 - app: FastAPI instance
"""

import os
from dotenv import load_dotenv

# Load .env from backend dir first, then fall back to root
_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_backend_dir, ".env"))           # backend/.env
load_dotenv(os.path.join(_backend_dir, "..", ".env"))     # root .env (fallback)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"message": "Crossword API is running"}