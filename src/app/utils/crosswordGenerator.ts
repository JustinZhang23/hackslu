interface WordEntry {
  id: string;
  word: string;
  clue: string;
}

interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  clue: string;
  number: number;
}

interface CrosswordData {
  grid: string[][];
  acrossClues: Array<{ number: number; clue: string; answer: string; row: number; col: number }>;
  downClues: Array<{ number: number; clue: string; answer: string; row: number; col: number }>;
}

export function generateCrossword(words: WordEntry[]): CrosswordData {
  // Sort words by length (longest first for better placement)
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
  
  // Estimate grid size based on total word length
  const totalLength = sortedWords.reduce((sum, w) => sum + w.word.length, 0);
  const gridSize = Math.max(15, Math.ceil(Math.sqrt(totalLength * 2)));
  
  // Initialize empty grid
  const grid: string[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill('#'));
  
  const placedWords: PlacedWord[] = [];
  
  // Place first word horizontally in the middle
  if (sortedWords.length > 0) {
    const firstWord = sortedWords[0];
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.floor((gridSize - firstWord.word.length) / 2);
    
    placeWord(grid, firstWord.word, startRow, startCol, 'across');
    placedWords.push({
      word: firstWord.word,
      row: startRow,
      col: startCol,
      direction: 'across',
      clue: firstWord.clue,
      number: 1,
    });
  }
  
  // Try to place remaining words
  for (let i = 1; i < sortedWords.length; i++) {
    const currentWord = sortedWords[i];
    let placed = false;
    
    // Try to find intersections with already placed words
    for (const placedWord of placedWords) {
      if (placed) break;
      
      // Try both directions
      for (const newDirection of ['across', 'down'] as const) {
        if (placed) break;
        if (newDirection === placedWord.direction) continue; // Only intersect perpendicular words
        
        // Find common letters
        for (let j = 0; j < currentWord.word.length; j++) {
          if (placed) break;
          
          for (let k = 0; k < placedWord.word.length; k++) {
            if (currentWord.word[j] === placedWord.word[k]) {
              let newRow, newCol;
              
              if (newDirection === 'across') {
                newRow = placedWord.row + k;
                newCol = placedWord.col - j;
              } else {
                newRow = placedWord.row - j;
                newCol = placedWord.col + k;
              }
              
              if (canPlaceWord(grid, currentWord.word, newRow, newCol, newDirection)) {
                placeWord(grid, currentWord.word, newRow, newCol, newDirection);
                placedWords.push({
                  word: currentWord.word,
                  row: newRow,
                  col: newCol,
                  direction: newDirection,
                  clue: currentWord.clue,
                  number: 0, // Will be assigned later
                });
                placed = true;
                break;
              }
            }
          }
        }
      }
    }
    
    // If word couldn't be placed, try to place it independently
    if (!placed) {
      const placed = tryPlaceIndependently(grid, currentWord.word, placedWords, currentWord.clue);
    }
  }
  
  // Trim the grid to remove excess empty space
  const trimmedGrid = trimGrid(grid);
  
  // Adjust placed words positions after trimming
  const { grid: finalGrid, placedWords: adjustedWords, trimOffsets } = trimGrid(grid, placedWords);
  
  // Assign numbers to words based on position
  assignNumbers(adjustedWords);
  
  // Separate into across and down clues
  const acrossClues = adjustedWords
    .filter(w => w.direction === 'across')
    .map(w => ({
      number: w.number,
      clue: w.clue,
      answer: w.word,
      row: w.row,
      col: w.col,
    }));
  
  const downClues = adjustedWords
    .filter(w => w.direction === 'down')
    .map(w => ({
      number: w.number,
      clue: w.clue,
      answer: w.word,
      row: w.row,
      col: w.col,
    }));
  
  return {
    grid: finalGrid,
    acrossClues,
    downClues,
  };
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): void {
  for (let i = 0; i < word.length; i++) {
    if (direction === 'across') {
      grid[row][col + i] = word[i];
    } else {
      grid[row + i][col] = word[i];
    }
  }
}

function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Check bounds
  if (direction === 'across') {
    if (row < 0 || row >= rows || col < 0 || col + word.length > cols) return false;
    
    // Check space before and after
    if (col > 0 && grid[row][col - 1] !== '#') return false;
    if (col + word.length < cols && grid[row][col + word.length] !== '#') return false;
    
    // Check each position
    for (let i = 0; i < word.length; i++) {
      const cell = grid[row][col + i];
      if (cell !== '#' && cell !== word[i]) return false;
      
      // Check above and below (except at intersections)
      if (cell === '#') {
        if (row > 0 && grid[row - 1][col + i] !== '#') return false;
        if (row < rows - 1 && grid[row + 1][col + i] !== '#') return false;
      }
    }
  } else {
    if (col < 0 || col >= cols || row < 0 || row + word.length > rows) return false;
    
    // Check space before and after
    if (row > 0 && grid[row - 1][col] !== '#') return false;
    if (row + word.length < rows && grid[row + word.length][col] !== '#') return false;
    
    // Check each position
    for (let i = 0; i < word.length; i++) {
      const cell = grid[row + i][col];
      if (cell !== '#' && cell !== word[i]) return false;
      
      // Check left and right (except at intersections)
      if (cell === '#') {
        if (col > 0 && grid[row + i][col - 1] !== '#') return false;
        if (col < cols - 1 && grid[row + i][col + 1] !== '#') return false;
      }
    }
  }
  
  return true;
}

function tryPlaceIndependently(
  grid: string[][],
  word: string,
  placedWords: PlacedWord[],
  clue: string
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Try random positions
  for (let attempts = 0; attempts < 100; attempts++) {
    const direction = Math.random() < 0.5 ? 'across' : 'down';
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    
    if (canPlaceWord(grid, word, row, col, direction)) {
      placeWord(grid, word, row, col, direction);
      placedWords.push({
        word,
        row,
        col,
        direction,
        clue,
        number: 0,
      });
      return true;
    }
  }
  
  return false;
}

function trimGrid(
  grid: string[][],
  placedWords?: PlacedWord[]
): { grid: string[][]; placedWords: PlacedWord[]; trimOffsets: { row: number; col: number } } | string[][] {
  let minRow = grid.length;
  let maxRow = -1;
  let minCol = grid[0].length;
  let maxCol = -1;
  
  // Find bounds of actual content
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] !== '#') {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  
  // Add padding
  minRow = Math.max(0, minRow - 1);
  maxRow = Math.min(grid.length - 1, maxRow + 1);
  minCol = Math.max(0, minCol - 1);
  maxCol = Math.min(grid[0].length - 1, maxCol + 1);
  
  // Create trimmed grid
  const trimmedGrid: string[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    trimmedGrid.push(grid[r].slice(minCol, maxCol + 1));
  }
  
  if (placedWords) {
    // Adjust placed word positions
    const adjustedWords = placedWords.map(w => ({
      ...w,
      row: w.row - minRow,
      col: w.col - minCol,
    }));
    
    return {
      grid: trimmedGrid,
      placedWords: adjustedWords,
      trimOffsets: { row: minRow, col: minCol },
    };
  }
  
  return trimmedGrid;
}

function assignNumbers(placedWords: PlacedWord[]): void {
  // Sort by row, then by column
  const sorted = [...placedWords].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  
  let currentNumber = 1;
  const positions = new Map<string, number>();
  
  for (const word of sorted) {
    const key = `${word.row},${word.col}`;
    if (!positions.has(key)) {
      positions.set(key, currentNumber++);
    }
    word.number = positions.get(key)!;
  }
}
