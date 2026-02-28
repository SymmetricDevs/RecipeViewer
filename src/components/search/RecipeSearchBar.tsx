import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { QueryChip, SearchEntity, FieldDef } from '../../types/recipeSearch';
import { SEARCH_FIELDS, VOLTAGE_TIERS, CATEGORY_OPTIONS } from '../../types/recipeSearch';
import { loadItemSearchIndex, loadFluidSearchIndex, loadMaterialSearchIndex, loadRecipeMapManifest, loadRecipePropsIndex } from '../../services/dataLoader';
import SearchFieldChip from './SearchFieldChip';

interface RecipeSearchBarProps {
  chips: QueryChip[];
  onAddChip: (chip: Omit<QueryChip, 'id'>) => void;
  onRemoveChip: (chipId: string) => void;
  autoFocus?: boolean;
}

interface SuggestionItem {
  label: string;
  description?: string;
  onSelect: () => void;
}

function RecipeSearchBar({ chips, onAddChip, onRemoveChip, autoFocus }: RecipeSearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeField, setActiveField] = useState<FieldDef | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cached search data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [itemSearchData, setItemSearchData] = useState<Record<string, any>[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fluidSearchData, setFluidSearchData] = useState<Record<string, any>[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [materialSearchData, setMaterialSearchData] = useState<Record<string, any>[] | null>(null);
  const [mapNames, setMapNames] = useState<string[] | null>(null);
  const [cleanroomTypes, setCleanroomTypes] = useState<string[]>(['any']);

  // Load search indexes on demand
  useEffect(() => {
    loadRecipeMapManifest().then(m => setMapNames([...m.maps, 'crafting', 'smelting'])).catch(() => {});
    loadRecipePropsIndex().then(pi => {
      const types = Object.keys(pi.cleanroom);
      setCleanroomTypes([...types, 'any']);
    }).catch(() => {});
  }, []);

  const ensureEntityData = useCallback(async () => {
    if (!itemSearchData) {
      loadItemSearchIndex().then(setItemSearchData).catch(() => {});
    }
    if (!fluidSearchData) {
      loadFluidSearchIndex().then(setFluidSearchData).catch(() => {});
    }
    if (!materialSearchData) {
      loadMaterialSearchIndex().then(setMaterialSearchData).catch(() => {});
    }
  }, [itemSearchData, fluidSearchData, materialSearchData]);

  // Build field suggestions
  const buildFieldSuggestions = useCallback((filter: string): SuggestionItem[] => {
    const lower = filter.toLowerCase();
    return SEARCH_FIELDS
      .filter(f => f.name.toLowerCase().includes(lower) || f.description.toLowerCase().includes(lower))
      .map(f => ({
        label: f.name,
        description: f.description,
        onSelect: () => {
          setActiveField(f);
          setInputValue('');
          setHighlightedIndex(0);
          if (f.valueType === 'entity') {
            ensureEntityData();
          }
        },
      }));
  }, [ensureEntityData]);

  // Build value suggestions for active field
  const buildValueSuggestions = useCallback((filter: string): SuggestionItem[] => {
    if (!activeField) return [];
    const lower = filter.toLowerCase();

    const addChipAndReset = (value: string, entity?: SearchEntity) => {
      onAddChip({ field: activeField.name, value, entity });
      setActiveField(null);
      setInputValue('');
      setHighlightedIndex(0);
    };

    switch (activeField.valueType) {
      case 'map': {
        if (!mapNames) return [];
        return mapNames
          .filter(m => m.toLowerCase().includes(lower))
          .slice(0, 20)
          .map(m => ({
            label: m,
            onSelect: () => addChipAndReset(m),
          }));
      }
      case 'tier': {
        return VOLTAGE_TIERS
          .filter(t => t.toLowerCase().includes(lower))
          .map(t => ({
            label: t,
            onSelect: () => addChipAndReset(t),
          }));
      }
      case 'category': {
        return CATEGORY_OPTIONS
          .filter(c => c.toLowerCase().includes(lower))
          .map(c => ({
            label: c,
            onSelect: () => addChipAndReset(c),
          }));
      }
      case 'cleanroom': {
        return cleanroomTypes
          .filter(c => c.toLowerCase().includes(lower))
          .map(c => ({
            label: c,
            onSelect: () => addChipAndReset(c),
          }));
      }
      case 'number':
      case 'range': {
        // Free text - show hint
        if (filter.trim()) {
          return [{
            label: filter.trim(),
            description: activeField.valueType === 'range' ? 'Enter number or range (e.g., 128..512)' : 'Enter a number',
            onSelect: () => addChipAndReset(filter.trim()),
          }];
        }
        return [{
          label: activeField.valueType === 'range' ? '128..512' : '0',
          description: activeField.valueType === 'range' ? 'Type a number or range (min..max)' : 'Type a number',
          onSelect: () => {},
        }];
      }
      case 'entity': {
        if (!lower || lower.length < 1) return [];
        const results: SuggestionItem[] = [];

        // Search items
        if (itemSearchData) {
          const matching = itemSearchData
            .filter(i => i.displayName?.toLowerCase().includes(lower) || i.resource?.toLowerCase().includes(lower))
            .slice(0, 8);
          for (const item of matching) {
            const key = `${item.resource}:${item.metadata ?? 0}`;
            results.push({
              label: item.displayName || item.resource,
              description: `Item - ${item.resource}`,
              onSelect: () => addChipAndReset(item.displayName || item.resource, {
                type: 'item',
                key,
                displayName: item.displayName || item.resource,
              }),
            });
          }
        }

        // Search fluids
        if (fluidSearchData) {
          const matching = fluidSearchData
            .filter(f => f.localizedName?.toLowerCase().includes(lower) || f.unlocalizedName?.toLowerCase().includes(lower))
            .slice(0, 8);
          for (const fluid of matching) {
            results.push({
              label: fluid.localizedName || fluid.unlocalizedName,
              description: `Fluid - ${fluid.unlocalizedName}`,
              onSelect: () => addChipAndReset(fluid.localizedName || fluid.unlocalizedName, {
                type: 'fluid',
                key: fluid.unlocalizedName,
                displayName: fluid.localizedName || fluid.unlocalizedName,
              }),
            });
          }
        }

        // Search materials
        if (materialSearchData) {
          const matching = materialSearchData
            .filter(m => m.localizedName?.toLowerCase().includes(lower) || m.unlocalizedName?.toLowerCase().includes(lower))
            .slice(0, 8);
          for (const mat of matching) {
            results.push({
              label: mat.localizedName || mat.unlocalizedName,
              description: `Material - ${mat.unlocalizedName}`,
              onSelect: () => addChipAndReset(mat.localizedName || mat.unlocalizedName, {
                type: 'material',
                key: mat.unlocalizedName,
                displayName: mat.localizedName || mat.unlocalizedName,
              }),
            });
          }
        }

        return results.slice(0, 20);
      }
      default:
        return [];
    }
  }, [activeField, mapNames, cleanroomTypes, itemSearchData, fluidSearchData, materialSearchData, onAddChip]);

  // Compute suggestions when input or field changes
  const suggestions = useMemo(() => {
    if (activeField) {
      return buildValueSuggestions(inputValue);
    }
    return buildFieldSuggestions(inputValue);
  }, [inputValue, activeField, buildFieldSuggestions, buildValueSuggestions]);

  // Clamp highlight index to valid range
  const clampedHighlight = suggestions.length > 0 ? Math.min(highlightedIndex, suggestions.length - 1) : 0;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Check for "field:" pattern when not in a field
    if (!activeField) {
      const colonIdx = val.indexOf(':');
      if (colonIdx > 0) {
        const fieldName = val.substring(0, colonIdx).trim().toLowerCase();
        const field = SEARCH_FIELDS.find(f => f.name.toLowerCase() === fieldName);
        if (field) {
          setActiveField(field);
          setInputValue(val.substring(colonIdx + 1).trim());
          if (field.valueType === 'entity') {
            ensureEntityData();
          }
          setShowDropdown(true);
          return;
        }
      }
    }

    setInputValue(val);
    setShowDropdown(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && clampedHighlight < suggestions.length) {
        suggestions[clampedHighlight].onSelect();
      } else if (activeField && (activeField.valueType === 'number' || activeField.valueType === 'range') && inputValue.trim()) {
        onAddChip({ field: activeField.name, value: inputValue.trim() });
        setActiveField(null);
        setInputValue('');
      }
      setShowDropdown(true);
    } else if (e.key === 'Escape') {
      if (activeField) {
        setActiveField(null);
        setInputValue('');
      } else {
        setShowDropdown(false);
      }
    } else if (e.key === 'Backspace' && inputValue === '') {
      if (activeField) {
        setActiveField(null);
      } else if (chips.length > 0) {
        onRemoveChip(chips[chips.length - 1].id);
      }
    } else if (e.key === 'Tab') {
      // Tab selects current suggestion
      if (suggestions.length > 0 && clampedHighlight < suggestions.length) {
        e.preventDefault();
        suggestions[clampedHighlight].onSelect();
        setShowDropdown(true);
      }
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (dropdownRef.current) {
      const item = dropdownRef.current.children[clampedHighlight] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [clampedHighlight]);

  const placeholder = activeField
    ? `Enter ${activeField.description.toLowerCase()}...`
    : 'Type a field name or press Enter to search...';

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus-within:border-cyan-500 transition"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 text-gray-500 shrink-0" />
        {chips.map(chip => (
          <SearchFieldChip key={chip.id} chip={chip} onRemove={onRemoveChip} />
        ))}
        {activeField && (
          <span className="text-gray-400 text-sm">{activeField.name}:</span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={chips.length === 0 && !activeField ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-gray-100 text-sm outline-none placeholder-gray-500"
          autoFocus={autoFocus}
        />
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition ${
                idx === clampedHighlight
                  ? 'bg-gray-700 text-cyan-400'
                  : 'text-gray-200 hover:bg-gray-700'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                suggestion.onSelect();
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <span className="font-medium">{suggestion.label}</span>
              {suggestion.description && (
                <span className="text-gray-500 text-xs ml-2 truncate">{suggestion.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecipeSearchBar;
