import type { ItemStack, ChancedOutput } from './items';
import type { FluidStack, ChancedFluidOutput, Fluid } from './fluids';

export interface GTRecipeInput {
  class: string;
  amount: number;
  oreDict: number;  // Index into oreDict keys array, -1 if not using oreDict
  sortingOrder: number;
  nonConsumable: boolean;
  inputStacks: ItemStack[];
  inputFluidStack: FluidStack | null;
}

export interface RecipeProperty {
  propertyKey: string;
  propertyClass: string;
  propertyHash: number;
  propertyValueClass: string;
}

export interface Recipe {
  class: string;
  EUt: number;
  duration: number;
  isCTRecipe: boolean;
  propertyCount: number;
  unhiddenPropertyCount: number;
  properties: RecipeProperty[];
  categoryName: string;
  categoryTranslationKey: string;
  categoryUniqueID: number;
  categoryModID: string;
  inputs: GTRecipeInput[];
  inputsFluid: GTRecipeInput[];
  outputs: ItemStack[];
  fluidOutputs: FluidStack[];
  chancedOutputs?: ChancedOutput[];
  chancedFluidOutputs?: ChancedFluidOutput[];
}

export interface RecipeMap {
  translationKey: string;
  sound: string | null;
  maxFluidInputs: number;
  maxInputs: number;
  maxOutputs: number;
  maxFluidOutputs: number;
  unlocalizedName: string;
  recipes: Recipe[];
}

export interface Ingredient {
  class: string;
  validInputs: ItemStack[];
  fluid?: FluidStack;
}

export interface ShapedRecipe {
  keymap: Record<string, Ingredient>;
  shape: string[];
}

export interface ShapelessRecipe {
  ingredients: Ingredient[];
}

export interface CraftingRecipe {
  id: string;
  isDynamic: boolean;
  class: string;
  group: string;
  registryName: string;
  type: 'shaped' | 'shapeless' | 'shapelessOre' | 'unknown';
  recipe: ShapedRecipe | ShapelessRecipe | null;
  output?: ItemStack;
}

export interface SmeltingRecipe {
  input: ItemStack;
  output: ItemStack;
}

export interface Machine {
  class: string;
  metaName: string;
  isController: boolean;
  tier?: number;
  recipemapName?: string;
  workable?: string;
  workableParallelLogicType?: string;
}

export interface RecipeDump {
  items: any[];
  fluids: Fluid[];
  oreDict: Record<string, ItemStack[]>;
  recipemaps: Record<string, RecipeMap>;
  crafting: CraftingRecipe[];
  smelting: SmeltingRecipe[];
  gtMTEs: Record<string, Machine>;
}
