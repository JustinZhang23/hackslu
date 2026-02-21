import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface WordEntry {
  id: string;
  word: string;
  clue: string;
}

interface CustomCrosswordBuilderProps {
  words: WordEntry[];
  setWords: (words: WordEntry[]) => void;
  onGenerate: () => void;
}

export function CustomCrosswordBuilder({ words, setWords, onGenerate }: CustomCrosswordBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false);

  const addWord = () => {
    setWords([...words, { id: Date.now().toString(), word: '', clue: '' }]);
  };

  const removeWord = (id: string) => {
    setWords(words.filter(w => w.id !== id));
  };

  const updateWord = (id: string, field: 'word' | 'clue', value: string) => {
    setWords(words.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const handleGenerate = () => {
    const validWords = words.filter(w => w.word.trim() && w.clue.trim());
    if (validWords.length < 2) {
      alert('Please add at least 2 words with clues');
      return;
    }
    onGenerate();
    setShowBuilder(false);
  };

  if (!showBuilder) {
    return (
      <button
        onClick={() => setShowBuilder(true)}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Create Custom Crossword
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-3xl">Custom Crossword Builder</h2>
          <p className="text-gray-600 mt-2">Add your words and clues to generate a crossword puzzle</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {words.map((word, index) => (
              <div key={word.id} className="flex gap-3 items-start">
                <span className="text-sm font-semibold text-gray-500 min-w-[2rem] mt-3">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  placeholder="Word (letters only)"
                  value={word.word}
                  onChange={(e) => updateWord(word.id, 'word', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg uppercase"
                />
                <input
                  type="text"
                  placeholder="Clue"
                  value={word.clue}
                  onChange={(e) => updateWord(word.id, 'clue', e.target.value)}
                  className="flex-[2] px-4 py-2 border border-gray-300 rounded-lg"
                />
                {words.length > 1 && (
                  <button
                    onClick={() => removeWord(word.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addWord}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Word
          </button>
        </div>

        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={() => setShowBuilder(false)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Crossword
          </button>
        </div>
      </div>
    </div>
  );
}