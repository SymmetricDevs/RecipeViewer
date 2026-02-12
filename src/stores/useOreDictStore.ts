import { create } from 'zustand';
import { loadOreDict } from '../services/dataLoader';

interface OreDictStore {
  oreDict: Record<string, any[]>;
  oreDictKeys: string[];
  loading: boolean;
  error: string | null;

  fetchOreDict: () => Promise<void>;
  getOreDictName: (index: number) => string | undefined;
}

export const useOreDictStore = create<OreDictStore>((set, get) => ({
  oreDict: {},
  oreDictKeys: [],
  loading: false,
  error: null,

  fetchOreDict: async () => {
    const { oreDict } = get();
    if (Object.keys(oreDict).length > 0) return; // Already loaded

    set({ loading: true, error: null });
    try {
      const data = await loadOreDict();
      const keys = Object.keys(data);
      set({ oreDict: data, oreDictKeys: keys, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getOreDictName: (index: number) => {
    const { oreDictKeys } = get();
    if (index < 0 || index >= oreDictKeys.length) {
      return undefined;
    }
    return oreDictKeys[index];
  },
}));
