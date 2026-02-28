import { useState, useEffect, useCallback, useRef } from 'react';
import type { QueryChip, RecipeQuery, SearchEntity } from '../../types/recipeSearch';
import type { LoadedRecipe } from '../../types/recipeIndex';
import { executeQuery, parseRange } from '../../services/recipeQueryEngine';
import RecipeSearchBar from './RecipeSearchBar';
import RecipeSearchResults from './RecipeSearchResults';

interface TabDef {
  label: string;
  query: Partial<RecipeQuery>;
}

interface RecipeSearchPanelProps {
  contextEntity?: SearchEntity;
  tabs?: TabDef[];
  defaultTab?: number;
  autoFocus?: boolean;
}

let chipIdCounter = 0;
function nextChipId(): string {
  return `panel-chip-${++chipIdCounter}`;
}

function RecipeSearchPanel({ contextEntity, tabs, defaultTab = 0, autoFocus }: RecipeSearchPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [results, setResults] = useState<LoadedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Track the initial load
  const initialLoadDone = useRef(false);

  // Build chips from tab query + extra user chips
  const buildChipsForTab = useCallback((tabIndex: number, extraChips: QueryChip[]): QueryChip[] => {
    const tabChips: QueryChip[] = [];

    if (tabs && tabs[tabIndex]) {
      const tabQuery = tabs[tabIndex].query;

      // Convert tab query fields into chips
      if (tabQuery.outputs && contextEntity) {
        tabChips.push({
          id: nextChipId(),
          field: 'outputs',
          value: contextEntity.displayName,
          entity: contextEntity,
        });
      }
      if (tabQuery.inputs && contextEntity) {
        tabChips.push({
          id: nextChipId(),
          field: 'inputs',
          value: contextEntity.displayName,
          entity: contextEntity,
        });
      }
      if (tabQuery.contains && contextEntity) {
        tabChips.push({
          id: nextChipId(),
          field: 'contains',
          value: contextEntity.displayName,
          entity: contextEntity,
        });
      }
      if (tabQuery.category) {
        tabChips.push({
          id: nextChipId(),
          field: 'category',
          value: tabQuery.category,
        });
      }
      if (tabQuery.maps) {
        for (const m of tabQuery.maps) {
          tabChips.push({ id: nextChipId(), field: 'map', value: m });
        }
      }
    } else if (contextEntity) {
      // No tabs: default to contains
      tabChips.push({
        id: nextChipId(),
        field: 'contains',
        value: contextEntity.displayName,
        entity: contextEntity,
      });
    }

    // Mark tab chips as locked (non-removable)
    for (const chip of tabChips) {
      chip.locked = true;
    }

    return [...tabChips, ...extraChips];
  }, [contextEntity, tabs]);

  // Extra chips added by the user on top of tab chips
  const [extraChips, setExtraChips] = useState<QueryChip[]>([]);

  // Compute effective chips
  const effectiveChips = buildChipsForTab(activeTab, extraChips);

  // Execute search
  const doSearch = useCallback(async (searchChips: QueryChip[]) => {
    if (searchChips.length === 0) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query from chips
      const query: RecipeQuery = {};
      for (const chip of searchChips) {
        switch (chip.field) {
          case 'map':
            if (!query.maps) query.maps = [];
            query.maps.push(chip.value);
            break;
          case 'contains':
            if (chip.entity) {
              if (!query.contains) query.contains = [];
              query.contains.push(chip.entity);
            }
            break;
          case 'inputs':
            if (chip.entity) {
              if (!query.inputs) query.inputs = [];
              query.inputs.push(chip.entity);
            }
            break;
          case 'outputs':
            if (chip.entity) {
              if (!query.outputs) query.outputs = [];
              query.outputs.push(chip.entity);
            }
            break;
          case 'exclude':
            if (chip.entity) {
              if (!query.excludes) query.excludes = [];
              query.excludes.push(chip.entity);
            }
            break;
          case 'exclude-input':
            if (chip.entity) {
              if (!query.excludeInputs) query.excludeInputs = [];
              query.excludeInputs.push(chip.entity);
            }
            break;
          case 'exclude-output':
            if (chip.entity) {
              if (!query.excludeOutputs) query.excludeOutputs = [];
              query.excludeOutputs.push(chip.entity);
            }
            break;
          case 'tier':
            query.tier = chip.value;
            break;
          case 'eut':
            query.eut = parseRange(chip.value) || undefined;
            break;
          case 'duration':
            query.duration = parseRange(chip.value) || undefined;
            break;
          case 'category':
            query.category = chip.value as RecipeQuery['category'];
            break;
          case 'temperature':
            query.temperature = parseRange(chip.value) || undefined;
            break;
          case 'dimension':
            query.dimension = parseInt(chip.value, 10);
            break;
          case 'cleanroom':
            query.cleanroom = chip.value;
            break;
        }
      }

      const results = await executeQuery(query);
      setResults(results);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run search when effective chips change
  useEffect(() => {
    doSearch(effectiveChips);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, extraChips, contextEntity]);

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current && contextEntity) {
      initialLoadDone.current = true;
      doSearch(effectiveChips);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddChip = (chip: Omit<QueryChip, 'id'>) => {
    const newChip: QueryChip = { ...chip, id: nextChipId() };
    setExtraChips(prev => [...prev, newChip]);
  };

  const handleRemoveChip = (chipId: string) => {
    setExtraChips(prev => prev.filter(c => c.id !== chipId));
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setPage(1);
  };

  return (
    <div>
      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex border-b border-gray-700 mb-4">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === idx
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => handleTabChange(idx)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <RecipeSearchBar
          chips={effectiveChips}
          onAddChip={handleAddChip}
          onRemoveChip={handleRemoveChip}
          autoFocus={autoFocus}
        />
      </div>

      {/* Results */}
      <RecipeSearchResults
        results={results}
        loading={loading}
        error={error}
        totalResults={results.length}
        page={page}
        onPageChange={setPage}
        hasQuery={effectiveChips.length > 0}
      />
    </div>
  );
}

export default RecipeSearchPanel;
