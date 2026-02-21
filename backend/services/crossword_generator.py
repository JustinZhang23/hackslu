"""Simple crossword generator using built-in word banks.

This module provides a small in-memory WORD_BANK and the function
`generate_crossword(topic, word_count=5)` that returns a layout-friendly
dictionary describing words, clues, and basic placement metadata.

Intended for demo/local use; replace or extend the word bank in production.
"""

import random
from typing import List, Dict

# Sample word banks by topic
WORD_BANK = {
    "python": [
        ("variable", "A named storage for data"),
        ("function", "Reusable block of code"),
        ("loop", "Repeats a block of code"),
        ("list", "Ordered collection"),
        ("tuple", "Immutable ordered collection"),
        ("dictionary", "Key-value data structure"),
        ("string", "Sequence of characters"),
        ("boolean", "True or False value"),
        ("class", "Blueprint for objects"),
        ("object", "Instance of a class"),
    ],
    "math": [
        ("matrix", "Rectangular array of numbers"),
        ("vector", "Quantity with magnitude and direction"),
        ("scalar", "Single numeric value"),
        ("integral", "Area under a curve"),
        ("derivative", "Rate of change"),
        ("theorem", "Mathematical statement"),
        ("proof", "Logical demonstration"),
        ("limit", "Value a function approaches"),
        ("angle", "Figure formed by two rays"),
        ("prime", "Number divisible by 1 and itself"),
    ]
}


def generate_crossword(topic: str, word_count: int = 5) -> Dict:
    topic = topic.lower()

    if topic not in WORD_BANK:
        return {
            "error": f"No word bank available for topic '{topic}'"
        }

    words = random.sample(WORD_BANK[topic], min(word_count, len(WORD_BANK[topic])))

    crossword_data = []
    row_position = 0

    for word, clue in words:
        crossword_data.append({
            "word": word.upper(),
            "clue": clue,
            "row": row_position,
            "col": 0,
            "direction": "across"
        })
        row_position += 2  # spacing between rows

    return {
        "topic": topic,
        "grid_size": row_position,
        "words": crossword_data
    }