import { create } from 'zustand';
import type {
  ItemRecipeIndex,
  FluidRecipeIndex,
  MaterialRecipeIndex,
  RecipeRef,
  LoadedRecipe,
  RecipesForItem,
  RecipesForFluid,
  RecipesForMaterial,
} from '../types/recipeIndex';
import {
  loadItemRecipeIndex,
  loadFluidRecipeIndex,
  loadMaterialRecipeIndex,
  loadRecipeMap,
  loadCrafting,
  loadSmelting,
} from '../services/dataLoader';

interface RecipeStore {
  // Indexes
  itemRecipeIndex: ItemRecipeIndex | null;
  fluidRecipeIndex: FluidRecipeIndex | null;
  materialRecipeIndex: MaterialRecipeIndex | null;
  indexLoading: boolean;
  indexError: string | null;

  // Cached recipe data
  recipeMapCache: Map<string, unknown>;
  craftingRecipes: unknown[] | null;
  smeltingRecipes: unknown[] | null;

  // Actions
  fetchRecipeIndexes: () => Promise<void>;
  getRecipesForItem: (resource: string, metadata: number) => Promise<RecipesForItem>;
  getRecipesForFluid: (unlocalizedName: string) => Promise<RecipesForFluid>;
  getRecipesForMaterial: (unlocalizedName: string) => Promise<RecipesForMaterial>;
  loadRecipeDetails: (refs: RecipeRef[]) => Promise<LoadedRecipe[]>;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  itemRecipeIndex: null,
  fluidRecipeIndex: null,
  materialRecipeIndex: null,
  indexLoading: false,
  indexError: null,

  recipeMapCache: new Map(),
  craftingRecipes: null,
  smeltingRecipes: null,

  fetchRecipeIndexes: async () => {
    const { itemRecipeIndex, fluidRecipeIndex, materialRecipeIndex, indexLoading } = get();

    // Already loaded or loading
    if (itemRecipeIndex && fluidRecipeIndex && materialRecipeIndex) return;
    if (indexLoading) return;

    set({ indexLoading: true, indexError: null });
    try {
      const [itemIdx, fluidIdx, matIdx] = await Promise.all([
        loadItemRecipeIndex(),
        loadFluidRecipeIndex(),
        loadMaterialRecipeIndex(),
      ]);
      set({
        itemRecipeIndex: itemIdx,
        fluidRecipeIndex: fluidIdx,
        materialRecipeIndex: matIdx,
        indexLoading: false,
      });
    } catch (error) {
      set({
        indexError: (error as Error).message,
        indexLoading: false,
      });
    }
  },

  getRecipesForItem: async (resource: string, metadata: number): Promise<RecipesForItem> => {
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
    const key = `${resource}:${metadata}`;
    const entry = index[key];

    // Also check for wildcard matches (32767)
    const wildcardKey = `${resource}:32767`;
    const wildcardEntry = index[wildcardKey];

    // Combine refs from exact match and wildcard
    const inputRefs = [...(entry?.asInput || [])];
    const outputRefs = [...(entry?.asOutput || [])];

    // Add wildcard refs if the metadata is not already wildcard
    if (metadata !== 32767 && wildcardEntry) {
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

  getRecipesForMaterial: async (unlocalizedName: string): Promise<RecipesForMaterial> => {
    const { materialRecipeIndex, fetchRecipeIndexes, loadRecipeDetails } = get();

    if (!materialRecipeIndex) {
      await fetchRecipeIndexes();
    }

    const index = get().materialRecipeIndex;
    if (!index) {
      return { production: [], interconversion: [], other: [] };
    }

    const entry = index[unlocalizedName];
    if (!entry) {
      return { production: [], interconversion: [], other: [] };
    }

    const [production, interconversion, other] = await Promise.all([
      loadRecipeDetails(entry.production),
      loadRecipeDetails(entry.interconversion),
      loadRecipeDetails(entry.other),
    ]);

    return { production, interconversion, other };
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
