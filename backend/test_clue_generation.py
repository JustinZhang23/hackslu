import sys
import os

# Add the backend directory to sys.path to import services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.gemini_adapter import generate_words_from_topic
from dotenv import load_dotenv

load_dotenv(dotenv_path="/Users/justinzhang/Documents/HackSLU/hackslu/backend/.env")

def test_topic(topic):
    print(f"\n--- Testing Topic: {topic} ---")
    results = generate_words_from_topic(topic)
    if results:
        print(f"Success! Generated {len(results)} words.")
        for item in results[:3]:
            print(f"Word: {item['word']}, Clue: {item['clue']}")
    else:
        print("Failed to generate words.")

if __name__ == "__main__":
    test_topic("biology")
    test_topic("cooking")
