// Recipe reference pointing to a specific recipe location
export interface RecipeRef {
  type: 'crafting' | 'smelting' | 'machine';
  index: number;
  map?: string; // For machine recipes, the recipe map name
}

// Recipe index entry for an item or fluid
export interface RecipeIndexEntry {
  asInput: RecipeRef[];
  asOutput: RecipeRef[];
}

// Full recipe index for items: key is "resource:itemDamage"
export type ItemRecipeIndex = Record<string, RecipeIndexEntry>;

// Full recipe index for fluids: key is "unlocalizedName"
export type FluidRecipeIndex = Record<string, RecipeIndexEntry>;

// Loaded recipe with its source information
export interface LoadedRecipe {
  ref: RecipeRef;
  recipe: unknown; // The actual recipe data
  mapName?: string; // Human-readable map name for machine recipes
}

// Recipes grouped by usage
export interface RecipesForItem {
  asInput: LoadedRecipe[];
  asOutput: LoadedRecipe[];
}

export interface RecipesForFluid {
  asInput: LoadedRecipe[];
  asOutput: LoadedRecipe[];
}
