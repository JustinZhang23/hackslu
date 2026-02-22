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
