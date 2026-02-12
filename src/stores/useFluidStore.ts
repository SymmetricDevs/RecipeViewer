import { create } from 'zustand';
import type { Fluid } from '../types/fluids';
import { loadFluids } from '../services/dataLoader';

interface FluidStore {
  fluids: Fluid[];
  loading: boolean;
  error: string | null;
  filteredFluids: Fluid[];
  searchQuery: string;

  fetchFluids: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  getFluidById: (index: number) => Fluid | null;
  getFluidByUnlocalizedName: (unlocalizedName: string) => Fluid | null;
  applyFilters: () => void;
}

export const useFluidStore = create<FluidStore>((set, get) => ({
  fluids: [],
  loading: false,
  error: null,
  filteredFluids: [],
  searchQuery: '',

  fetchFluids: async () => {
    set({ loading: true, error: null });
    try {
      const fluids = await loadFluids();
      set({ fluids, filteredFluids: fluids, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  applyFilters: () => {
    const { fluids, searchQuery } = get();
    let filtered = fluids;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fluid =>
        fluid.localizedName.toLowerCase().includes(query) ||
        fluid.fluidName.toLowerCase().includes(query)
      );
    }

    set({ filteredFluids: filtered });
  },

  getFluidById: (index: number) => {
    const { fluids } = get();
    return fluids[index] || null;
  },

  getFluidByUnlocalizedName: (unlocalizedName: string) => {
    const { fluids } = get();
    return fluids.find((fluid) => fluid.unlocalizedName === unlocalizedName) || null;
  },
}));
