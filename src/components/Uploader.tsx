import React, { useState } from 'react';
import { UploadCloud, File as FileIcon, Loader2, Key } from 'lucide-react';
import { extractCrosswordData } from '../lib/gemini';
import { ExtractedWord } from '../lib/generator';

interface UploaderProps {
    onExtracted: (words: ExtractedWord[]) => void;
}

export function Uploader({ onExtracted }: UploaderProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            setError('');

            const words = await extractCrosswordData(file);
            onExtracted(words);

        } catch (err: any) {
            setError(err.message || 'An error occurred during extraction.');
        } finally {
            setLoading(false);
            // clear the input so user can upload same file again if needed
            e.target.value = '';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Upload Box */}
            <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="border-2 border-dashed border-indigo-200 bg-white/70 backdrop-blur-md rounded-2xl p-10 text-center transition-all hover:border-indigo-400">

                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.pptx"
                        onChange={processFile}
                        disabled={loading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                        {loading ? (
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
