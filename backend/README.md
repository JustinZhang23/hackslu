# Backend README

This document provides quick setup and run instructions for the backend API (FastAPI) and the Gemini (Vertex AI) integration.

## Quick setup (macOS, zsh)

1. Create a virtual environment and activate it:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Configure Google Vertex AI (Gemini)

- Create a Google Cloud project and enable Vertex AI.
- Create a service account with the appropriate Vertex AI roles and download the JSON key.
- Set environment variables (example):

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GEMINI_MODEL="text-bison@001"
```

4. (Optional) If you don't want to install `python-pptx` for local development, enable mock slide parsing:

```bash
export SLIDE_PARSER_MOCK=true
```

## Run the server

```bash
uvicorn backend.main:app --reload
```

## Endpoints

- GET /crossword/{topic}?use_ai=true
  - Generates a crossword for the given topic. If `use_ai=true`, the backend will call Gemini to generate words and clues (requires Vertex AI configured).

- POST /slides/group
  - Accepts a PPTX file upload (`multipart/form-data` with field `file`) and returns grouped terms with AI-provided answers. If `SLIDE_PARSER_MOCK=true`, the endpoint will return mock terms without requiring `python-pptx`.

## Notes

- Do not commit service account keys to source control.
- AI calls may incur costs; use carefully and add caching/rate limiting for production.
