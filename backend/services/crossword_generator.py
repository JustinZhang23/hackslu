"""Simple crossword generator using built-in word banks.

This module provides a small in-memory WORD_BANK and the function
`generate_crossword(topic, word_count=5)` that returns a layout-friendly
dictionary describing words, clues, and basic placement metadata.

Intended for demo/local use; replace or extend the word bank in production.
"""

import random
from typing import List, Dict

def generate_crossword(words_input: List[Dict]) -> Dict:
    """Generate a crossword layout from a list of words and clues.

    Input: [{"word": "PYTHON", "clue": "..."}]
    Output: {
        "grid_size": { "rows": R, "cols": C },
        "grid": [["#", "P", "#"], ...],
        "words": [
            {"word": "PYTHON", "clue": "...", "row": 0, "col": 1, "direction": "down", "number": 1}
        ]
    }
    """
    if not words_input:
        return {"error": "No words provided."}

    # Normalize inputs
    words = []
    for item in words_input:
        w = str(item.get("word", "")).strip().upper()
        # Remove spaces/punctuation
        w = ''.join(c for c in w if c.isalpha())
        c = str(item.get("clue", "")).strip()
        if len(w) > 1:
            words.append({"word": w, "clue": c})

    if not words:
        return {"error": "No valid words found after sanitization."}

    # Sort words by length descending (often easier to place long words first)
    words.sort(key=lambda x: len(x["word"]), reverse=True)

    # Internal representation of the grid
    # We'll use a relatively large grid to start and crop it later
    GRID_MIN = 100
    grid = [["#" for _ in range(GRID_MIN)] for _ in range(GRID_MIN)]
    
    placed_words = []
    
    def can_place(word, start_r, start_c, direction):
        """Check if a word can be placed at (start_r, start_c) in `direction`"""
        r, c = start_r, start_c
        intersections = 0
        
        # Check out of bounds
        if direction == "across":
            if c + len(word) > GRID_MIN: return False
        else:
            if r + len(word) > GRID_MIN: return False

        for i, char in enumerate(word):
            curr_r = r + (i if direction == "down" else 0)
            curr_c = c + (i if direction == "across" else 0)
            
            # If the cell is occupied by a different letter, placement fails
            if grid[curr_r][curr_c] != "#" and grid[curr_r][curr_c] != char:
                return False
                
            if grid[curr_r][curr_c] == char:
                intersections += 1
                
            # Check adjacent cells to ensure we don't accidentally touch other words
            # and create unintended 2-letter words.
            # Only check if we are dropping a NEW letter.
            if grid[curr_r][curr_c] == "#":
                if direction == "across":
                    # Check above and below
                    if curr_r > 0 and grid[curr_r - 1][curr_c] != "#": return False
                    if curr_r < GRID_MIN - 1 and grid[curr_r + 1][curr_c] != "#": return False
                else: # down
                    # Check left and right
                    if curr_c > 0 and grid[curr_r][curr_c - 1] != "#": return False
                    if curr_c < GRID_MIN - 1 and grid[curr_r][curr_c + 1] != "#": return False
                    
        # Also check the cells immediately before and after the word
        if direction == "across":
            if start_c > 0 and grid[start_r][start_c - 1] != "#": return False
            if start_c + len(word) < GRID_MIN and grid[start_r][start_c + len(word)] != "#": return False
        else:
            if start_r > 0 and grid[start_r - 1][start_c] != "#": return False
            if start_r + len(word) < GRID_MIN and grid[start_r + len(word)][start_c] != "#": return False

        # If it's the first word, intersection count doesn't matter.
        # Otherwise, must intersect at least one existing letter.
        if len(placed_words) > 0 and intersections == 0:
            return False
            
        return True

    def place(word_obj, start_r, start_c, direction):
        """Place word onto the grid and add to tracking list"""
        word = word_obj["word"]
        r, c = start_r, start_c
        for i, char in enumerate(word):
            curr_r = r + (i if direction == "down" else 0)
            curr_c = c + (i if direction == "across" else 0)
            grid[curr_r][curr_c] = char
            
        placed_words.append({
            "word": word,
            "clue": word_obj["clue"],
            "row": start_r,
            "col": start_c,
            "direction": direction,
            "number": 0 # to be assigned later
        })

    # 1. Place the first word roughly in the middle, across
    first_word = words[0]
    center_r = GRID_MIN // 2
    center_c = (GRID_MIN - len(first_word["word"])) // 2
    place(first_word, center_r, center_c, "across")

    # 2. Iterate through the rest and try to attach to existing grid letters
    for word_obj in words[1:]:
        word_text = word_obj["word"]
        placed = False
        
        # We need to find every existing letter on the grid that matches any letter in our word_text.
        # To avoid early bias, we collect all valid placements and pick one randomly.
        valid_placements = []
        
        for r in range(GRID_MIN):
            for c in range(GRID_MIN):
                if grid[r][c] != "#":
                    # For every letter in the new word that matches the grid letter
                    for i, char in enumerate(word_text):
                        if char == grid[r][c]:
                            # Try placing Across
                            start_c_across = c - i
                            if start_c_across >= 0 and can_place(word_text, r, start_c_across, "across"):
                                valid_placements.append((r, start_c_across, "across"))
                            
                            # Try placing Down
                            start_r_down = r - i
                            if start_r_down >= 0 and can_place(word_text, start_r_down, c, "down"):
                                valid_placements.append((start_r_down, c, "down"))
                                
        if valid_placements:
            # Pick a valid placement
            best_r, best_c, best_d = random.choice(valid_placements)
            place(word_obj, best_r, best_c, best_d)
            placed = True

    if not placed_words:
        return {"error": "Could not place any words on the grid."}

    # 3. Crop the Grid to its bounding box
    min_r, max_r = GRID_MIN, -1
    min_c, max_c = GRID_MIN, -1
    
    for r in range(GRID_MIN):
        for c in range(GRID_MIN):
            if grid[r][c] != "#":
                min_r = min(min_r, r)
                max_r = max(max_r, r)
                min_c = min(min_c, c)
                max_c = max(max_c, c)

    cropped_grid = []
    for r in range(min_r, max_r + 1):
        cropped_row = grid[r][min_c : max_c + 1]
        cropped_grid.append(cropped_row)

    # 4. Assign numbers based on reading order (top-to-bottom, left-to-right)
    # We look for cells that are the start of an across or down word
    placed_words.sort(key=lambda w: (w["row"], w["col"]))
    
    # We need to track the number assignment
    # A single cell can be the start of both an across and down word, so they share the number.
    start_cells = {}
    current_number = 1
    
    for w in placed_words:
        start_pos = (w["row"], w["col"])
        if start_pos not in start_cells:
            start_cells[start_pos] = current_number
            current_number += 1
        
        w["number"] = start_cells[start_pos]
        # Adjust offset for the cropped grid
        w["row"] = w["row"] - min_r
        w["col"] = w["col"] - min_c

    # Separate into across and down
    across_clues = [w for w in placed_words if w["direction"] == "across"]
    down_clues = [w for w in placed_words if w["direction"] == "down"]

    return {
        "grid": cropped_grid,
        "acrossClues": across_clues,
        "downClues": down_clues
    }