export interface ItemStack {
  type?: 'ItemStack';
  displayName?: string;
  resource: string;
  count?: number;
  metadata?: number;
  itemDamage?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nbt?: any;
}

// Item with displayName always present (from items.json)
export interface ItemWithDisplay extends ItemStack {
  displayName: string;
}

export interface Item extends ItemWithDisplay {
  translationKey: string;
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
