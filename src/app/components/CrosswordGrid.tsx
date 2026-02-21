import { useEffect, useRef } from 'react';

interface CrosswordGridProps {
  grid: string[][];
  userGrid: string[][];
  selectedCell: { row: number; col: number } | null;
  direction: 'across' | 'down';
  onCellChange: (row: number, col: number, value: string) => void;
  onCellClick: (row: number, col: number) => void;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  setDirection: (direction: 'across' | 'down') => void;
  isCorrect: (row: number, col: number) => boolean;
}

// Cell numbers for the grid
const CELL_NUMBERS: (number | null)[][] = [
  [1, null, null, null, 2, null, null],
  [4, null, 10, null, 5, null, 14],
  [6, null, null, null, 13, null, null],
  [null, null, null, 8, null, null, null],
  [9, null, null, null, null, null, null],
  [3, null, null, null, 12, 7, null],
  [11, null, null, null, null, null, null],
];

export function CrosswordGrid({
  grid,
  userGrid,
  selectedCell,
  direction,
  onCellChange,
  onCellClick,
  setSelectedCell,
  setDirection,
  isCorrect,
}: CrosswordGridProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array(grid.length)
      .fill(null)
      .map(() => Array(grid[0].length).fill(null))
  );

  useEffect(() => {
    if (selectedCell) {
      const input = inputRefs.current[selectedCell.row][selectedCell.col];
      input?.focus();
    }
  }, [selectedCell]);

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Backspace') {
      if (userGrid[row][col] === '') {
        // Move to previous cell
        moveToPrevious(row, col);
      } else {
        onCellChange(row, col, '');
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      moveRight(row, col);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      moveLeft(row, col);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      moveDown(row, col);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      moveUp(row, col);
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        moveToPrevious(row, col);
      } else {
        moveToNext(row, col);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>, row: number, col: number) => {
    const value = e.currentTarget.value;
    const lastChar = value.slice(-1); // Get only the last character typed
    
    if (/^[A-Za-z]$/.test(lastChar)) {
      e.currentTarget.value = ''; // Clear the input
      onCellChange(row, col, lastChar);
      moveToNext(row, col);
    } else if (value === '') {
      onCellChange(row, col, '');
    }
  };

  const moveToNext = (row: number, col: number) => {
    if (direction === 'across') {
      moveRight(row, col);
    } else {
      moveDown(row, col);
    }
  };

  const moveToPrevious = (row: number, col: number) => {
    if (direction === 'across') {
      moveLeft(row, col);
    } else {
      moveUp(row, col);
    }
  };

  const moveRight = (row: number, col: number) => {
    for (let c = col + 1; c < grid[0].length; c++) {
      if (grid[row][c] !== '#') {
        setSelectedCell({ row, col: c });
        return;
      }
    }
  };

  const moveLeft = (row: number, col: number) => {
    for (let c = col - 1; c >= 0; c--) {
      if (grid[row][c] !== '#') {
        setSelectedCell({ row, col: c });
        return;
      }
    }
  };

  const moveDown = (row: number, col: number) => {
    for (let r = row + 1; r < grid.length; r++) {
      if (grid[r][col] !== '#') {
        setSelectedCell({ row: r, col });
        return;
      }
    }
  };

  const moveUp = (row: number, col: number) => {
    for (let r = row - 1; r >= 0; r--) {
      if (grid[r][col] !== '#') {
        setSelectedCell({ row: r, col });
        return;
      }
    }
  };

  const isInCurrentWord = (row: number, col: number): boolean => {
    if (!selectedCell) return false;

    if (direction === 'across' && row === selectedCell.row) {
      // Find the start and end of the current word
      let start = selectedCell.col;
      let end = selectedCell.col;
      while (start > 0 && grid[row][start - 1] !== '#') start--;
      while (end < grid[0].length - 1 && grid[row][end + 1] !== '#') end++;
      return col >= start && col <= end;
    } else if (direction === 'down' && col === selectedCell.col) {
      let start = selectedCell.row;
      let end = selectedCell.row;
      while (start > 0 && grid[start - 1][col] !== '#') start--;
      while (end < grid.length - 1 && grid[end + 1][col] !== '#') end++;
      return row >= start && row <= end;
    }
    return false;
  };

  return (
    <div className="inline-block mx-auto">
      <div className="grid gap-0 border-2 border-gray-900">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => {
              const isBlack = cell === '#';
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              const isHighlighted = isInCurrentWord(rowIndex, colIndex);
              const cellNumber = CELL_NUMBERS[rowIndex][colIndex];
              const correct = isCorrect(rowIndex, colIndex);

              // Determine background color based on priority
              let bgColor = 'bg-white';
              if (isBlack) {
                bgColor = 'bg-gray-900';
              } else if (!correct) {
                bgColor = 'bg-red-100';
              } else if (userGrid[rowIndex][colIndex] !== '' && userGrid[rowIndex][colIndex] === grid[rowIndex][colIndex]) {
                bgColor = 'bg-green-100';
              } else if (isHighlighted && !isSelected) {
                bgColor = 'bg-blue-100';
              }

              return (
                <div
                  key={colIndex}
                  className={`w-12 h-12 border border-gray-400 relative ${bgColor} ${
                    isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''
                  }`}
                  onClick={() => !isBlack && onCellClick(rowIndex, colIndex)}
                >
                  {!isBlack && (
                    <>
                      {cellNumber && (
                        <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-gray-700">
                          {cellNumber}
                        </span>
                      )}
                      <input
                        ref={el => (inputRefs.current[rowIndex][colIndex] = el)}
                        type="text"
                        maxLength={1}
                        value={userGrid[rowIndex][colIndex]}
                        onInput={e => handleInput(e, rowIndex, colIndex)}
                        onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                        onClick={() => onCellClick(rowIndex, colIndex)}
                        className="w-full h-full text-center text-xl uppercase font-semibold bg-transparent outline-none cursor-pointer caret-transparent"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}