import { create } from 'zustand';
import type { Material } from '../types/materials';
import { loadMaterials } from '../services/dataLoader';

interface MaterialStore {
  materials: Material[];
  loading: boolean;
  error: string | null;
  filteredMaterials: Material[];
  searchQuery: string;

  fetchMaterials: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  getMaterialByUnlocalizedName: (unlocalizedName: string) => Material | null;
  applyFilters: () => void;
}

export const useMaterialStore = create<MaterialStore>((set, get) => ({
  materials: [],
  loading: false,
  error: null,
  filteredMaterials: [],
  searchQuery: '',

  fetchMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const materials = await loadMaterials();
      set({ materials, filteredMaterials: materials, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  applyFilters: () => {
    const { materials, searchQuery } = get();
    let filtered = materials;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(mat => {
        if (mat.localizedName.toLowerCase().includes(query) ||
            mat.unlocalizedName.toLowerCase().includes(query)) {
          return true;
        }
        if (mat.chemicalFormula) {
          // Normalize subscript digits (₀-₉) to regular digits for matching
          const normalizedFormula = mat.chemicalFormula
            .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => String(ch.charCodeAt(0) - 0x2080));
          return normalizedFormula.toLowerCase().includes(query) ||
            mat.chemicalFormula.toLowerCase().includes(query);
        }
        return false;
      });
    }

    set({ filteredMaterials: filtered });
  },

  getMaterialByUnlocalizedName: (unlocalizedName: string) => {
    const { materials } = get();
    return materials.find((mat) => mat.unlocalizedName === unlocalizedName) || null;
  },
}));
