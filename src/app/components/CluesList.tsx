interface Clue {
  number: number;
  clue: string;
  answer: string;
}

interface CluesListProps {
  title: string;
  clues: Clue[];
}

export function CluesList({ title, clues }: CluesListProps) {
  // Sort clues by number
  const sortedClues = [...clues].sort((a, b) => a.number - b.number);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl mb-4">{title}</h2>
      <div className="space-y-3">
        {sortedClues.map(clue => (
          <div key={`${title}-${clue.number}`} className="flex gap-3">
            <span className="font-semibold text-indigo-600 min-w-[2rem]">{clue.number}.</span>
            <span className="text-gray-700">{clue.clue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
