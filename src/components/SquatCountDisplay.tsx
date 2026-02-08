import type { PersonSquatInfo } from '../hooks/useSquatCounter';

interface SquatCountDisplayProps {
  persons: PersonSquatInfo[];
  totalCount: number;
}

export function SquatCountDisplay({ persons, totalCount }: SquatCountDisplayProps) {
  if (persons.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 min-w-[160px]">
      <div className="bg-blue-700 text-white px-4 py-2 rounded-lg text-center">
        <div className="text-xs font-mono uppercase tracking-wide opacity-80">Total</div>
        <div className="text-3xl font-bold">{totalCount}</div>
      </div>

      {persons.map((person) => (
        <div
          key={person.id}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center justify-between gap-3"
        >
          <div className="text-sm font-mono">
            <span className="opacity-60">ID:{person.id}</span>
          </div>
          <div className="text-xl font-bold">{person.count}</div>
          <div
            className={`text-xs px-2 py-0.5 rounded ${
              person.state === 'SQUATTING'
                ? 'bg-orange-500 text-white'
                : 'bg-green-600 text-white'
            }`}
          >
            {person.state === 'SQUATTING' ? 'DOWN' : 'UP'}
          </div>
        </div>
      ))}
    </div>
  );
}
