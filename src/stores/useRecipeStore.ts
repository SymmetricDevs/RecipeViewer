import { create } from 'zustand';
import type {
  ItemRecipeIndex,
  FluidRecipeIndex,
  RecipeRef,
  LoadedRecipe,
  RecipesForItem,
  RecipesForFluid,
} from '../types/recipeIndex';
import {
  loadItemRecipeIndex,
  loadFluidRecipeIndex,
  loadRecipeMap,
  loadCrafting,
  loadSmelting,
} from '../services/dataLoader';

interface RecipeStore {
  // Indexes
  itemRecipeIndex: ItemRecipeIndex | null;
  fluidRecipeIndex: FluidRecipeIndex | null;
  indexLoading: boolean;
  indexError: string | null;

  // Cached recipe data
  recipeMapCache: Map<string, unknown>;
  craftingRecipes: unknown[] | null;
  smeltingRecipes: unknown[] | null;

  // Actions
  fetchRecipeIndexes: () => Promise<void>;
  getRecipesForItem: (resource: string, itemDamage: number) => Promise<RecipesForItem>;
  getRecipesForFluid: (unlocalizedName: string) => Promise<RecipesForFluid>;
  loadRecipeDetails: (refs: RecipeRef[]) => Promise<LoadedRecipe[]>;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  itemRecipeIndex: null,
  fluidRecipeIndex: null,
  indexLoading: false,
  indexError: null,

  recipeMapCache: new Map(),
  craftingRecipes: null,
  smeltingRecipes: null,

  fetchRecipeIndexes: async () => {
    const { itemRecipeIndex, fluidRecipeIndex, indexLoading } = get();

    // Already loaded or loading
    if (itemRecipeIndex && fluidRecipeIndex) return;
    if (indexLoading) return;

    set({ indexLoading: true, indexError: null });
    try {
      const [itemIdx, fluidIdx] = await Promise.all([
        loadItemRecipeIndex(),
        loadFluidRecipeIndex(),
      ]);
      set({
        itemRecipeIndex: itemIdx,
        fluidRecipeIndex: fluidIdx,
        indexLoading: false,
      });
    } catch (error) {
      set({
        indexError: (error as Error).message,
        indexLoading: false,
      });
    }
  },

  getRecipesForItem: async (resource: string, itemDamage: number): Promise<RecipesForItem> => {
    const { itemRecipeIndex, fetchRecipeIndexes, loadRecipeDetails } = get();

    // Ensure indexes are loaded
    if (!itemRecipeIndex) {
      await fetchRecipeIndexes();
    }

    const index = get().itemRecipeIndex;
    if (!index) {
      return { asInput: [], asOutput: [] };
    }

    // Build key and look up
    const key = `${resource}:${itemDamage}`;
    const entry = index[key];

    // Also check for wildcard matches (32767)
    const wildcardKey = `${resource}:32767`;
    const wildcardEntry = index[wildcardKey];

    // Combine refs from exact match and wildcard
    const inputRefs = [...(entry?.asInput || [])];
    const outputRefs = [...(entry?.asOutput || [])];

    // Add wildcard refs if the item damage is not already wildcard
    if (itemDamage !== 32767 && wildcardEntry) {
      inputRefs.push(...wildcardEntry.asInput);
      outputRefs.push(...wildcardEntry.asOutput);
    }

    // Load recipe details
    const [asInput, asOutput] = await Promise.all([
      loadRecipeDetails(inputRefs),
      loadRecipeDetails(outputRefs),
    ]);

    return { asInput, asOutput };
  },

  getRecipesForFluid: async (unlocalizedName: string): Promise<RecipesForFluid> => {
    const { fluidRecipeIndex, fetchRecipeIndexes, loadRecipeDetails } = get();

    // Ensure indexes are loaded
    if (!fluidRecipeIndex) {
      await fetchRecipeIndexes();
    }

    const index = get().fluidRecipeIndex;
    if (!index) {
      return { asInput: [], asOutput: [] };
    }

    const entry = index[unlocalizedName];
    if (!entry) {
      return { asInput: [], asOutput: [] };
    }

    const [asInput, asOutput] = await Promise.all([
      loadRecipeDetails(entry.asInput),
      loadRecipeDetails(entry.asOutput),
    ]);

    return { asInput, asOutput };
  },

  loadRecipeDetails: async (refs: RecipeRef[]): Promise<LoadedRecipe[]> => {
    const { recipeMapCache, craftingRecipes, smeltingRecipes } = get();

    // Group refs by type and map for efficient loading
    const machineRefs: { ref: RecipeRef; map: string }[] = [];
    const craftingRefs: RecipeRef[] = [];
    const smeltingRefs: RecipeRef[] = [];

    for (const ref of refs) {
      if (ref.type === 'machine' && ref.map) {
        machineRefs.push({ ref, map: ref.map });
      } else if (ref.type === 'crafting') {
        craftingRefs.push(ref);
      } else if (ref.type === 'smelting') {
        smeltingRefs.push(ref);
      }
    }

    // Load any missing recipe maps
    const mapsToLoad = [...new Set(machineRefs.map((r) => r.map))].filter(
      (map) => !recipeMapCache.has(map)
    );

    const loadedMaps = await Promise.all(mapsToLoad.map((map) => loadRecipeMap(map)));
    const newCache = new Map(recipeMapCache);
    mapsToLoad.forEach((map, i) => {
      newCache.set(map, loadedMaps[i]);
    });

    // Load crafting/smelting if needed
    let crafting = craftingRecipes;
    let smelting = smeltingRecipes;

    if (craftingRefs.length > 0 && !crafting) {
      crafting = await loadCrafting();
    }
    if (smeltingRefs.length > 0 && !smelting) {
      smelting = await loadSmelting();
    }

    // Update state with loaded data
    set({
      recipeMapCache: newCache,
      craftingRecipes: crafting,
      smeltingRecipes: smelting,
    });

    // Build loaded recipes
    const loaded: LoadedRecipe[] = [];

    for (const { ref, map } of machineRefs) {
      const mapData = newCache.get(map) as { recipes?: unknown[]; unlocalizedName?: string } | undefined;
      if (mapData?.recipes?.[ref.index]) {
        loaded.push({
          ref,
          recipe: mapData.recipes[ref.index],
          mapName: mapData.unlocalizedName || map,
        });
      }
    }

    for (const ref of craftingRefs) {
      if (crafting?.[ref.index]) {
        loaded.push({
          ref,
          recipe: crafting[ref.index],
        });
      }
    }

    for (const ref of smeltingRefs) {
      if (smelting?.[ref.index]) {
        loaded.push({
          ref,
          recipe: smelting[ref.index],
        });
      }
    }

    return loaded;
  },
}));
