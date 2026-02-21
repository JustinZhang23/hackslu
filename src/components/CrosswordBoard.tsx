import React, { useState, useEffect } from 'react';
import { PuzzleLayout, PlacedWord } from '../lib/generator';

interface CrosswordBoardProps {
    puzzle: PuzzleLayout;
}

export function CrosswordBoard({ puzzle }: CrosswordBoardProps) {
    const [userGrid, setUserGrid] = useState<string[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [direction, setDirection] = useState<'across' | 'down'>('across');
    const [isChecked, setIsChecked] = useState(false);
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // Initialize empty user grid matching the puzzle size
    useEffect(() => {
        if (puzzle && puzzle.grid) {
            setUserGrid(puzzle.grid.map(row => row.map(cell => cell === '#' ? '#' : '')));
            setSelectedCell(null);
            setDirection('across');
            setIsChecked(false);
            setShowAnswerKey(false);
            setIsRevealed(false);
        }
    }, [puzzle]);

    if (!puzzle || !puzzle.grid || userGrid.length === 0) return null;

    const handleCellClick = (r: number, c: number) => {
        if (puzzle.grid[r][c] === '#') return;

        // Toggle direction if clicking the same cell
        if (selectedCell?.r === r && selectedCell?.c === c) {
            setDirection(direction === 'across' ? 'down' : 'across');
        } else {
            setSelectedCell({ r, c });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
        const key = e.key;

        if (key.match(/^[a-zA-Z]$/)) {
            setIsChecked(false); // Clear check state when typing
            const newGrid = [...userGrid];
            newGrid[r] = [...newGrid[r]];
            newGrid[r][c] = key.toUpperCase();
            setUserGrid(newGrid);

            // Auto advance
            if (direction === 'across' && c + 1 < puzzle.grid[r].length && puzzle.grid[r][c + 1] !== '#') {
                setSelectedCell({ r, c: c + 1 });
            } else if (direction === 'down' && r + 1 < puzzle.grid.length && puzzle.grid[r + 1][c] !== '#') {
                setSelectedCell({ r: r + 1, c });
            }
        } else if (key === 'Backspace') {
            setIsChecked(false); // Clear check state when deleting
            const newGrid = [...userGrid];
            newGrid[r] = [...newGrid[r]];
            newGrid[r][c] = '';
            setUserGrid(newGrid);

            // Auto retreat
            if (direction === 'across' && c - 1 >= 0 && puzzle.grid[r][c - 1] !== '#') {
                setSelectedCell({ r, c: c - 1 });
            } else if (direction === 'down' && r - 1 >= 0 && puzzle.grid[r - 1][c] !== '#') {
                setSelectedCell({ r: r - 1, c });
            }
        } else if (key === 'ArrowRight' && c + 1 < puzzle.grid[r].length) {
            setSelectedCell({ r, c: c + 1 });
            setDirection('across');
        } else if (key === 'ArrowLeft' && c - 1 >= 0) {
            setSelectedCell({ r, c: c - 1 });
            setDirection('across');
        } else if (key === 'ArrowDown' && r + 1 < puzzle.grid.length) {
            setSelectedCell({ r: r + 1, c });
            setDirection('down');
        } else if (key === 'ArrowUp' && r - 1 >= 0) {
            setSelectedCell({ r: r - 1, c });
            setDirection('down');
        }
    };

    const getNumber = (r: number, c: number) => {
        const list = [...puzzle.acrossClues, ...puzzle.downClues];
        const match = list.find(w => w.row === r && w.col === c);
        return match ? match.number : null;
    };

    const handleCheck = () => {
        setIsChecked(true);
    };

    const handleReset = () => {
        if (confirm("Clear all your answers?")) {
            setIsChecked(false);
            setUserGrid(puzzle.grid.map(row => row.map(cell => cell === '#' ? '#' : '')));
        }
    };

    const handleReveal = () => {
        if (isRevealed) {
            setIsRevealed(false);
        } else if (confirm("Reveal the entire puzzle? Warning: This will show the entire puzzle")) {
            setIsChecked(true);
            setIsRevealed(true);
        }
    };

    const isWideGrid = puzzle.grid[0].length >= 15;

    return (
        <div className={`w-full flex ${isWideGrid ? 'flex-col' : 'flex-col lg:flex-row'} gap-8 mt-12 animate-in fade-in slide-in-from-bottom-5 duration-700`}>

            {/* Board Column */}
            <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl flex flex-col items-center overflow-x-auto">

                {/* The Grid */}
                <div
                    className="inline-grid shadow-2xl rounded-sm bg-transparent gap-0"
                    style={{ gridTemplateColumns: `repeat(${puzzle.grid[0].length}, max-content)` }}
                >
                    {puzzle.grid.map((row, r) =>
                        row.map((cell, c) => {
                            const isBlack = cell === '#';
                            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                            const val = isRevealed && !isBlack ? puzzle.grid[r][c] : (userGrid[r]?.[c] || '');
                            const num = getNumber(r, c);

                            if (isBlack) {
                                return <div key={`${r}-${c}`} className="w-10 h-10 sm:w-12 sm:h-12 bg-transparent" />;
                            }

                            // Neighbor logic for uniform borders
                            const hasTop = r > 0 && puzzle.grid[r - 1][c] !== '#';
                            const hasBottom = r < puzzle.grid.length - 1 && puzzle.grid[r + 1][c] !== '#';
                            const hasLeft = c > 0 && puzzle.grid[r][c - 1] !== '#';
                            const hasRight = c < puzzle.grid[0].length - 1 && puzzle.grid[r][c + 1] !== '#';

                            const borderClasses = `
                                ${hasTop ? 'border-t-2' : 'border-t-4'}
                                ${hasBottom ? 'border-b-2' : 'border-b-4'}
                                ${hasLeft ? 'border-l-2' : 'border-l-4'}
                                ${hasRight ? 'border-r-2' : 'border-r-4'}
                            `.trim();

                            let cellTextColor = isSelected ? 'text-indigo-900' : 'text-indigo-700';
                            let bgColor = isSelected ? 'bg-yellow-200' : 'bg-white cursor-pointer hover:bg-indigo-50';

                            if (isChecked && val) {
                                if (val === puzzle.grid[r][c]) {
                                    cellTextColor = 'text-green-600';
                                    bgColor = isSelected ? 'bg-green-200' : 'bg-green-50';
                                } else {
                                    cellTextColor = 'text-red-500';
                                    bgColor = isSelected ? 'bg-red-200' : 'bg-red-50';
                                }
                            }

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl font-bold uppercase transition-colors select-none ${bgColor} ${borderClasses} border-slate-900 box-border`}
                                >
                                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center">
                                        {num && (
                                            <span className="absolute top-0.5 left-1 text-[11px] text-gray-800 font-bold z-10 select-none">
                                                {num}
                                            </span>
                                        )}
                                        <input
                                            type="text"
                                            value={val}
                                            maxLength={1}
                                            readOnly
                                            onKeyDown={(e) => handleKeyDown(e, r, c)}
                                            className={`w-full h-full bg-transparent text-center flex items-center justify-center outline-none cursor-pointer m-0 p-0 pt-2 sm:pt-3 text-2xl leading-none ${cellTextColor}`}
                                            ref={el => {
                                                if (isSelected && el) el.focus();
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex gap-4 mt-8 flex-wrap justify-center font-sans">
                    <button onClick={handleCheck} className="px-6 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors">Check Answers</button>
                    <button onClick={handleReset} className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">Reset</button>
                    <button onClick={handleReveal} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        {isRevealed ? 'Hide Answers' : 'Reveal Grid'}
                    </button>
                    <button onClick={() => setShowAnswerKey(!showAnswerKey)} className="px-6 py-2 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors">
                        {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
                    </button>
                </div>
            </div>

            {/* Clues Column */}
            <div className={`w-full ${isWideGrid ? 'flex flex-col md:flex-row' : 'lg:w-96 flex flex-col'} gap-6`}>
                <ClueBox title="Across" clues={puzzle.acrossClues} />
                <ClueBox title="Down" clues={puzzle.downClues} />
            </div>

            {/* Toggleable Answer Key Section */}
            {showAnswerKey && (
                <div className="w-full bg-white/80 backdrop-blur-xl border border-purple-200 p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 mt-4">
                    <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
                        <span className="p-2 bg-purple-100 rounded-lg text-purple-600">🔑</span>
                        Answer Key
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-purple-100 pb-2">Across Answers</h3>
                            <ul className="space-y-4">
                                {puzzle.acrossClues.map(c => (
                                    <li key={c.number} className="group">
                                        <div className="flex items-start gap-3">
                                            <span className="font-bold text-purple-600 w-6 flex-shrink-0 mt-0.5">{c.number}.</span>
                                            <div className="space-y-1">
                                                <p className="text-gray-700 leading-tight italic text-sm">{c.clue}</p>
                                                <p className="font-mono text-lg font-bold tracking-widest text-indigo-700 uppercase">{c.answer}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-purple-100 pb-2">Down Answers</h3>
                            <ul className="space-y-4">
                                {puzzle.downClues.map(c => (
                                    <li key={c.number} className="group">
                                        <div className="flex items-start gap-3">
                                            <span className="font-bold text-purple-600 w-6 flex-shrink-0 mt-0.5">{c.number}.</span>
                                            <div className="space-y-1">
                                                <p className="text-gray-700 leading-tight italic text-sm">{c.clue}</p>
                                                <p className="font-mono text-lg font-bold tracking-widest text-indigo-700 uppercase">{c.answer}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function ClueBox({ title, clues }: { title: string, clues: PlacedWord[] }) {
    if (clues.length === 0) return null;
    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-xl flex-1 max-h-[500px] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4 sticky top-0 bg-white/90 backdrop-blur pb-2">{title}</h3>
            <ul className="space-y-3">
                {clues.map(c => (
                    <li key={c.number} className="flex gap-3 text-sm">
                        <span className="font-bold text-indigo-600 w-6 text-right flex-shrink-0">{c.number}.</span>
                        <span className="text-gray-700 leading-relaxed">{c.clue}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
