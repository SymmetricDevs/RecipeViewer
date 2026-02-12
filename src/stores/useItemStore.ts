import { create } from 'zustand';
import type { Item } from '../types/items';
import { loadItems } from '../services/dataLoader';

interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;
  filteredItems: Item[];
  searchQuery: string;
  modFilter: string | null;
  rarityFilter: string | null;

  fetchItems: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setModFilter: (mod: string | null) => void;
  setRarityFilter: (rarity: string | null) => void;
  getItemById: (index: number) => Item | null;
  getItemByResourceAndDamage: (resource: string, damage: number) => Item | null;
  applyFilters: () => void;
}

export const useItemStore = create<ItemStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  filteredItems: [],
  searchQuery: '',
  modFilter: null,
  rarityFilter: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await loadItems();
      set({ items, filteredItems: items, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setModFilter: (mod: string | null) => {
    set({ modFilter: mod });
    get().applyFilters();
  },

  setRarityFilter: (rarity: string | null) => {
    set({ rarityFilter: rarity });
    get().applyFilters();
  },

  applyFilters: () => {
    const { items, searchQuery, modFilter, rarityFilter } = get();
    let filtered = items;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.displayName.toLowerCase().includes(query) ||
        item.resource.toLowerCase().includes(query)
      );
    }

    if (modFilter) {
      filtered = filtered.filter(item => {
        const mod = item.resource.split(':')[0];
        return mod === modFilter;
      });
    }

    if (rarityFilter) {
      filtered = filtered.filter(item => item.rarity === rarityFilter);
    }

    set({ filteredItems: filtered });
  },

  getItemById: (index: number) => {
    const { items } = get();
    return items[index] || null;
  },

  getItemByResourceAndDamage: (resource: string, damage: number) => {
    const { items } = get();
    return items.find(
      (item) => item.resource === resource && item.itemDamage === damage
    ) || null;
  },
}));
