// @ts-ignore
import clg from 'crossword-layout-generator';

export interface ExtractedWord {
    word: string;
    clue: string;
}

export interface PlacedWord {
    number: number;
    clue: string;
    answer: string;
    row: number;
    col: number;
    direction: 'across' | 'down';
}

export interface PuzzleLayout {
    grid: string[][];
    acrossClues: PlacedWord[];
    downClues: PlacedWord[];
}

export function generateCrossword(words: ExtractedWord[]): PuzzleLayout {
    if (!words || words.length < 2) {
        throw new Error("Provide at least 2 words for the crossword.");
    }

    // Sanitize the inputs
    const inputWords = words.map(w => ({
        clue: (w.clue || '').trim(),
        answer: (w.word || '').trim().toUpperCase().replace(/[^A-Z]/g, '')
    })).filter(w => w.answer.length > 0);

    if (inputWords.length < 2) {
        throw new Error("Invalid words after sanitization. Needs A-Z characters.");
    }

    try {
        // Attempt generation
        const engine = clg.generateLayout || (clg as any).default?.generateLayout;
        if (!engine) throw new Error("Layout engine failed to load in this environment.");

        const layoutObj = engine(inputWords);

        if (!layoutObj || !layoutObj.table) {
            throw new Error("Engine returned an empty layout.");
        }

        const rawGrid: string[][] = layoutObj.table;

        // Find the bounding box to crop excess empty rows/columns
        let minR = rawGrid.length, maxR = -1;
        let minC = rawGrid[0]?.length || 0, maxC = -1;

        for (let r = 0; r < rawGrid.length; r++) {
            for (let c = 0; c < rawGrid[r].length; c++) {
                if (rawGrid[r][c] !== '-' && rawGrid[r][c] !== ' ') {
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }

        if (maxR === -1 || maxC === -1) {
            throw new Error("Grid is empty after generation.");
        }

        // Check if the grid exceeds the maximum width of 25
        const width = maxC - minC + 1;
        if (width > 25 && inputWords.length > 2) {
            // Try again with fewer words if it's too wide
            return generateCrossword(words.slice(0, words.length - 1));
        }

        // Convert '-' to '#' and apply bounding box crop
        const grid: string[][] = [];
        for (let r = minR; r <= maxR; r++) {
            const newRow: string[] = [];
            for (let c = minC; c <= maxC; c++) {
                let val = rawGrid[r][c];
                newRow.push(val === '-' || val === ' ' ? '#' : val);
            }
            grid.push(newRow);
        }

        const acrossClues: PlacedWord[] = [];
        const downClues: PlacedWord[] = [];

        const placementRes = layoutObj.result || [];
        placementRes.forEach((item: any) => {
            // Skip invalid or unplaced words (position 0 or less)
            if (!item.position || item.position <= 0) return;

            // Library is 1-indexed, we convert to 0-indexed and apply crop offset
            const r = (item.starty || 1) - 1 - minR;
            const c = (item.startx || 1) - 1 - minC;

            // safety bounds check
            if (r < 0 || c < 0 || r >= grid.length || c >= (grid[0]?.length || 0)) return;

            const placedInfo: PlacedWord = {
                number: item.position,
                clue: item.clue || '',
                answer: item.answer || '',
                row: r,
                col: c,
                direction: item.orientation === 'across' ? 'across' : 'down'
            };

            if (placedInfo.direction === 'across') {
                acrossClues.push(placedInfo);
            } else {
                downClues.push(placedInfo);
            }
        });

        acrossClues.sort((a, b) => a.number - b.number);
        downClues.sort((a, b) => a.number - b.number);

        return { grid, acrossClues, downClues };
    } catch (err: any) {
        console.error("Layout generation failed: ", err);
        throw new Error(err.message || "Failed to generate crossword layout.");
    }
}
