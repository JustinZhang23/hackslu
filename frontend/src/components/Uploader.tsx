import React, { useState } from 'react';
import { UploadCloud, Loader2, Lightbulb, BookOpen } from 'lucide-react';
import { extractCrosswordData, generateFromTopic } from '../lib/gemini';
import { ExtractedWord } from '../lib/generator';

interface UploaderProps {
    onExtracted: (words: ExtractedWord[]) => void;
}

type Tab = 'file' | 'topic';

export function Uploader({ onExtracted }: UploaderProps) {
    const [activeTab, setActiveTab] = useState<Tab>('file');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [topic, setTopic] = useState('');

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
            e.target.value = '';
        }
    };

    const processTopic = async () => {
        if (!topic.trim()) return;
        try {
            setLoading(true);
            setError('');
            const words = await generateFromTopic(topic.trim());
            onExtracted(words);
        } catch (err: any) {
            setError(err.message || 'An error occurred generating from topic.');
        } finally {
            setLoading(false);
        }
    };

    const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') processTopic();
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">

            {/* Tabs */}
            <div className="flex gap-2 bg-white/60 backdrop-blur border border-white rounded-2xl p-1.5 shadow-md">
                <button
                    onClick={() => { setActiveTab('file'); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'file'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                >
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                </button>
                <button
                    onClick={() => { setActiveTab('topic'); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'topic'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                >
                    <Lightbulb className="w-4 h-4" />
                    Generate from Topic
                </button>
            </div>

            {/* File Upload Panel */}
            {activeTab === 'file' && (
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
                                <div className="mt-4 text-red-500 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium pointer-events-auto">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Topic Panel */}
            {activeTab === 'topic' && (
                <div className="bg-white/70 backdrop-blur-md border border-purple-100 rounded-2xl p-8 space-y-5 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Generate from Any Topic</h3>
                            <p className="text-gray-500 text-sm mt-0.5">Gemini will brainstorm key terms and clues using its knowledge</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={handleTopicKeyDown}
                            placeholder="e.g. The Roman Empire, Photosynthesis, Taylor Swift..."
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl border border-purple-200 bg-white/80 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                        />
                        <button
                            onClick={processTopic}
                            disabled={loading || !topic.trim()}
                            className="px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                            ) : (
                                <>✨ Generate</>
                            )}
                        </button>
                    </div>

                    {/* Example chips */}
                    {!loading && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-gray-400 self-center">Try:</span>
                            {['Quantum Physics', 'The French Revolution', 'DNA Replication', 'Ancient Egypt', 'Machine Learning'].map(ex => (
                                <button
                                    key={ex}
                                    onClick={() => setTopic(ex)}
                                    className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
