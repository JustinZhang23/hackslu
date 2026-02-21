import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { CrosswordBoard } from './components/CrosswordBoard';
import { generateCrossword, ExtractedWord, PuzzleLayout } from './lib/generator';

export default function App() {
    const [puzzle, setPuzzle] = useState<PuzzleLayout | null>(null);
    const [words, setWords] = useState<ExtractedWord[]>([]);
    const [errorStatus, setErrorStatus] = useState<string>('');

    const handleWordsExtracted = (extractedItems: ExtractedWord[]) => {
        setWords(extractedItems);
        setErrorStatus('');
        try {
            const layoutObj = generateCrossword(extractedItems);
            setPuzzle(layoutObj);
        } catch (err: any) {
            console.error(err);
            setErrorStatus(err.message || "Failed to generate a stable crossword layout with those words.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-12 font-sans overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <header className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        AI Slideshow Crossword
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        A locally-run, super-stable crossword generator. Upload your slideshow to let Gemini extract concepts, and play the puzzle instantly!
                    </p>
                </header>

                {/* Uploader Section */}
                <Uploader onExtracted={handleWordsExtracted} />

                {/* Error Handling */}
                {errorStatus && (
                    <div className="mt-8 bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-xl text-center shadow-sm">
                        <p className="font-semibold text-lg">Crossword Generation Failed</p>
                        <p className="opacity-90">{errorStatus}</p>
                    </div>
                )}

                {/* The Game Board */}
                {puzzle && !errorStatus && (
                    <CrosswordBoard puzzle={puzzle} />
                )}

            </div>
        </div>
    );
}
