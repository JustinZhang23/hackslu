import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-flash-latest")

try:
    response = model.generate_content("Say hello in one word.")
    print(f"Response: {response.text.strip()}")
except Exception as e:
    print(f"Error calling Gemini: {e}")
