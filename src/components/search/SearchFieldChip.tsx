import { X } from 'lucide-react';
import type { QueryChip } from '../../types/recipeSearch';

interface SearchFieldChipProps {
  chip: QueryChip;
  onRemove: (chipId: string) => void;
}

function SearchFieldChip({ chip, onRemove }: SearchFieldChipProps) {
  if (chip.locked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 text-sm rounded border border-gray-700 text-gray-500">
        <span>{chip.field}:</span>
        <span className="text-gray-400">{chip.value}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-sm rounded border border-gray-600">
      <span className="text-gray-400">{chip.field}:</span>
      <span className="text-cyan-400">{chip.value}</span>
      <button
        onClick={() => onRemove(chip.id)}
        className="ml-0.5 text-gray-500 hover:text-gray-200 transition"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default SearchFieldChip;
