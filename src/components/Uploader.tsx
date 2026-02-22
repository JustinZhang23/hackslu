import React, { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { PuzzleLayout } from '../lib/types';

interface UploaderProps {
    onExtracted: (puzzle: PuzzleLayout) => void;
}

export function Uploader({ onExtracted }: UploaderProps) {
    const [loadingTopic, setLoadingTopic] = useState(false);
    const [loadingFile, setLoadingFile] = useState(false);
    const [error, setError] = useState('');
    const [topicInput, setTopicInput] = useState('');

    const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string, fileName: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                if (base64) resolve({ base64, mimeType: file.type, fileName: file.name });
                else reject(new Error("Failed to parse base64"));
            };
            reader.onerror = () => reject(new Error("File read error"));
            reader.readAsDataURL(file);
        });
    };

    const processTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topicInput.trim()) return;

        try {
            setLoadingTopic(true);
            setError('');

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const req = await fetch(`${apiUrl}/crossword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topicInput.trim() })
            });

            if (!req.ok) {
                const errData = await req.json();
                throw new Error(errData.detail || "Failed to generate crossword from backend.");
            }

            const puzzle: PuzzleLayout = await req.json();
            onExtracted(puzzle);

        } catch (err: any) {
            setError(err.message || 'An error occurred during extraction.');
        } finally {
            setLoadingTopic(false);
        }
    };

    const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoadingFile(true);
            setError('');

            const fileData = await fileToBase64(file);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const req = await fetch(`${apiUrl}/crossword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_base64: fileData.base64,
                    mime_type: fileData.mimeType,
                    file_name: fileData.fileName
                })
            });

            if (!req.ok) {
                const errData = await req.json();
                throw new Error(errData.detail || "Failed to generate crossword from backend.");
            }

            const puzzle: PuzzleLayout = await req.json();
            onExtracted(puzzle);

        } catch (err: any) {
            setError(err.message || 'An error occurred during extraction.');
        } finally {
            setLoadingFile(false);
            e.target.value = '';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Topic Input Form */}
            <form onSubmit={processTopic} className="bg-white/70 backdrop-blur-md border border-indigo-100 p-6 rounded-2xl flex gap-4 shadow-sm items-center transition-all hover:border-indigo-300">
                <input
                    type="text"
                    placeholder="Enter a topic (e.g., Computer Science)"
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    disabled={loadingTopic || loadingFile}
                    className="flex-1 bg-transparent text-lg outline-none text-gray-800 placeholder-gray-400"
                />
                <button
                    type="submit"
                    disabled={loadingTopic || loadingFile || !topicInput.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                    {loadingTopic ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
                </button>
            </form>

            <div className="text-center text-gray-400 font-medium">OR</div>

            {/* Upload Box */}
            <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="border-2 border-dashed border-indigo-200 bg-white/70 backdrop-blur-md rounded-2xl p-10 text-center transition-all hover:border-indigo-400">

                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.pptx"
                        onChange={processFile}
                        disabled={loadingTopic || loadingFile}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                        {loadingFile ? (
                            <>
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Processing Document...</h3>
                                    <p className="text-gray-500 mt-2">Extracting concepts and interpreting images (OCR)</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Upload Presentation</h3>
                                    <p className="text-gray-500 mt-2">Click or drag a PPTX, PDF, or Image</p>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="mt-4 text-red-500 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
