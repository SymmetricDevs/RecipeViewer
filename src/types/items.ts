export interface ItemStack {
  type: 'ItemStack';
  displayName: string;
  count?: number;
  metadata?: number;
  itemDamage?: number;
  nbt?: any;
}

export interface Item extends ItemStack {
  translationKey: string;
  resource: string;
  maxDamage: number;
  repairCost: number;
  hasSubtypes: boolean;
  maxStackSize: number;
  rarity: string;
  itemClass: string;
  itemTranslationKey: string;
}

export interface ItemFilter {
  mod?: string;
  rarity?: string;
  searchQuery?: string;
}

export interface ChancedOutput extends ItemStack {
  chance: number;
}
