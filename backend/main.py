"""Application entrypoint.

This module creates the FastAPI `app` instance and includes the API router
defined in `app.py`. Start the server with e.g.:

    uvicorn backend.main:app --reload

Exports:
 - app: FastAPI instance
"""

import os
from dotenv import load_dotenv

# Load the environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

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