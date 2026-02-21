import { useState } from 'react';
import { CrosswordGrid } from './components/CrosswordGrid';
import { CluesList } from './components/CluesList';
import { CustomCrosswordBuilder } from './components/CustomCrosswordBuilder';
import { generateCrossword } from './utils/crosswordGenerator';

interface WordEntry {
  id: string;
  word: string;
  clue: string;
}

interface PuzzleData {
  grid: string[][];
  acrossClues: Array<{ number: number; clue: string; answer: string; row: number; col: number }>;
  downClues: Array<{ number: number; clue: string; answer: string; row: number; col: number }>;
}

// Define the crossword structure
const DEFAULT_PUZZLE_DATA: PuzzleData = {
  grid: [
    ['C', 'A', 'T', '#', 'D', 'O', 'G'],
    ['A', '#', 'O', '#', 'A', '#', 'O'],
    ['R', 'U', 'N', '#', 'Y', '#', 'A'],
    ['#', '#', '#', 'S', 'U', 'N', '#'],
    ['B', 'I', 'R', 'D', '#', '#', 'T'],
    ['O', '#', 'A', '#', 'M', 'O', 'O'],
    ['Y', 'E', 'S', '#', '#', 'N', '#'],
  ],
  acrossClues: [
    { number: 1, clue: 'Feline pet', answer: 'CAT', row: 0, col: 0 },
    { number: 2, clue: 'Canine companion', answer: 'DOG', row: 0, col: 4 },
    { number: 6, clue: 'Sprint', answer: 'RUN', row: 2, col: 0 },
    { number: 8, clue: 'Star in the sky', answer: 'SUN', row: 3, col: 3 },
    { number: 9, clue: 'Feathered animal', answer: 'BIRD', row: 4, col: 0 },
    { number: 11, clue: 'Affirmative response', answer: 'YES', row: 6, col: 0 },
    { number: 12, clue: 'Sound a cow makes', answer: 'MOO', row: 5, col: 4 },
  ],
  downClues: [
    { number: 4, clue: 'Automobile', answer: 'CAR', row: 0, col: 0 },
    { number: 3, clue: 'Male child', answer: 'BOY', row: 4, col: 0 },
    { number: 5, clue: 'Opposite of night', answer: 'DAY', row: 0, col: 4 },
    { number: 7, clue: 'Opposite of off', answer: 'ON', row: 5, col: 5 },
    { number: 10, clue: 'Zodiac sign (Ram)', answer: 'ARIES', row: 1, col: 2 },
    { number: 13, clue: 'Nautical affirmative', answer: 'AYE', row: 1, col: 4 },
    { number: 14, clue: 'Objective', answer: 'GOAL', row: 0, col: 6 },
  ],
};

export default function App() {
  const [puzzleData, setPuzzleData] = useState<PuzzleData>(DEFAULT_PUZZLE_DATA);
  const [userGrid, setUserGrid] = useState<string[][]>(
    DEFAULT_PUZZLE_DATA.grid.map(row => row.map(cell => (cell === '#' ? '#' : '')))
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [showAnswers, setShowAnswers] = useState(false);
  const [gridSize, setGridSize] = useState({ rows: 7, cols: 7 });
  const [customWords, setCustomWords] = useState<WordEntry[]>([{ id: '1', word: '', clue: '' }]);

  const handleCellChange = (row: number, col: number, value: string) => {
    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = value.toUpperCase();
    setUserGrid(newGrid);
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedCell?.row === row && selectedCell?.col === col) {
      // Toggle direction if clicking the same cell
      setDirection(direction === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }
  };

  const handleCheck = () => {
    setShowAnswers(true);
    // Hide answers after 3 seconds
    setTimeout(() => {
      setShowAnswers(false);
    }, 3000);
  };

  const handleClearWrong = () => {
    const newGrid = userGrid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell === '#') return '#';
        if (cell === '') return '';
        // Clear if incorrect
        if (cell !== puzzleData.grid[rowIndex][colIndex]) {
          return '';
        }
        return cell;
      })
    );
    setUserGrid(newGrid);
  };

  const handleReset = () => {
    setUserGrid(puzzleData.grid.map(row => row.map(cell => (cell === '#' ? '#' : ''))));
    setShowAnswers(false);
  };

  const handleGridSizeChange = (rows: number, cols: number) => {
    // Create a new empty grid with the specified size
    const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(''));
    setUserGrid(newGrid);
    setGridSize({ rows, cols });
    setSelectedCell(null);
  };

  const isCorrect = (row: number, col: number): boolean => {
    if (!showAnswers || userGrid[row][col] === '') return true;
    return userGrid[row][col] === puzzleData.grid[row][col];
  };

  const getCorrectCount = (): number => {
    let count = 0;
    userGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell !== '' && cell !== '#' && cell === puzzleData.grid[rowIndex][colIndex]) {
          count++;
        }
      });
    });
    return count;
  };

  const getTotalCells = (): number => {
    return puzzleData.grid.flat().filter(cell => cell !== '#').length;
  };

  const handleGenerateCrossword = () => {
    const validWords = customWords.filter(w => w.word.trim() && w.clue.trim());
    const newPuzzleData = generateCrossword(validWords);
    setPuzzleData(newPuzzleData);
    setUserGrid(newPuzzleData.grid.map(row => row.map(cell => (cell === '#' ? '#' : ''))));
    setDirection('across');
    setSelectedCell(null);
    setShowAnswers(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl mb-2">Crossword Puzzle</h1>
          <p className="text-gray-600">Click a cell and start typing. Click again to change direction.</p>
          
          <div className="mt-6 flex gap-4 justify-center items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Rows:</span>
              <input
                type="number"
                min="3"
                max="20"
                value={gridSize.rows}
                onChange={(e) => handleGridSizeChange(Number(e.target.value), gridSize.cols)}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Cols:</span>
              <input
                type="number"
                min="3"
                max="20"
                value={gridSize.cols}
                onChange={(e) => handleGridSizeChange(gridSize.rows, Number(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg"
              />
            </label>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <CrosswordGrid
              grid={puzzleData.grid}
              userGrid={userGrid}
              selectedCell={selectedCell}
              direction={direction}
              onCellChange={handleCellChange}
              onCellClick={handleCellClick}
              setSelectedCell={setSelectedCell}
              setDirection={setDirection}
              isCorrect={isCorrect}
            />

            <div className="flex gap-4 mt-6 justify-center">
              <button
                onClick={handleCheck}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Check Answers
              </button>
              <button
                onClick={handleClearWrong}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Clear Wrong
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl mb-4">Progress</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Correct:</span>
                  <span className="text-2xl font-semibold text-green-600">{getCorrectCount()} / {getTotalCells()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(getCorrectCount() / getTotalCells()) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CluesList title="Across" clues={puzzleData.acrossClues} />
              <CluesList title="Down" clues={puzzleData.downClues} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <CustomCrosswordBuilder
            words={customWords}
            setWords={setCustomWords}
            onGenerate={handleGenerateCrossword}
          />
        </div>
      </div>
    </div>
  );
}