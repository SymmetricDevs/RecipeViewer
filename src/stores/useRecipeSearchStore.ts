import { create } from 'zustand';
import type { LoadedRecipe } from '../types/recipeIndex';
import type { QueryChip, RecipeQuery } from '../types/recipeSearch';
import { executeQuery, parseRange } from '../services/recipeQueryEngine';

let chipIdCounter = 0;
function nextChipId(): string {
  return `chip-${++chipIdCounter}`;
}

interface RecipeSearchStore {
  chips: QueryChip[];
  results: LoadedRecipe[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  page: number;

  addChip: (chip: Omit<QueryChip, 'id'>) => void;
  removeChip: (chipId: string) => void;
  clearChips: () => void;
  setChips: (chips: Omit<QueryChip, 'id'>[]) => void;
  executeSearch: () => Promise<void>;
  setPage: (page: number) => void;
}

function buildQueryFromChips(chips: QueryChip[]): RecipeQuery {
  const query: RecipeQuery = {};

  for (const chip of chips) {
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

  return query;
}

export const useRecipeSearchStore = create<RecipeSearchStore>((set, get) => ({
  chips: [],
  results: [],
  loading: false,
  error: null,
  totalResults: 0,
  page: 1,

  addChip: (chip) => {
    const newChip: QueryChip = { ...chip, id: nextChipId() };
    set(state => ({ chips: [...state.chips, newChip], page: 1 }));
  },

  removeChip: (chipId) => {
    set(state => ({
      chips: state.chips.filter(c => c.id !== chipId),
      page: 1,
    }));
  },

  clearChips: () => {
    set({ chips: [], results: [], totalResults: 0, page: 1, error: null });
  },

  setChips: (chips) => {
    set({
      chips: chips.map(c => ({ ...c, id: nextChipId() })),
      page: 1,
    });
  },

  executeSearch: async () => {
    const { chips } = get();
    if (chips.length === 0) {
      set({ results: [], totalResults: 0, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      const query = buildQueryFromChips(chips);
      const results = await executeQuery(query);
      set({ results, totalResults: results.length, loading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        loading: false,
        results: [],
        totalResults: 0,
      });
    }
  },

  setPage: (page) => {
    set({ page });
  },
}));
