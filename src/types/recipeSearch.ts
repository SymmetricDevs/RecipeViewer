import type { RecipeRef } from './recipeIndex';

export type SearchEntityType = 'item' | 'fluid' | 'material';

export interface SearchEntity {
  type: SearchEntityType;
  key: string;        // recipe index lookup key
  displayName: string;
}

export type RangeValue = { min?: number; max?: number };

export interface RecipeQuery {
  maps?: string[];
  contains?: SearchEntity[];
  inputs?: SearchEntity[];
  outputs?: SearchEntity[];
  excludes?: SearchEntity[];
  excludeInputs?: SearchEntity[];
  excludeOutputs?: SearchEntity[];
  tier?: string;
  eut?: RangeValue;
  duration?: RangeValue;
  category?: 'production' | 'interconversion' | 'other';
  temperature?: RangeValue;
  dimension?: number;
  cleanroom?: string;
}

export interface QueryChip {
  id: string;         // unique ID for React keys
  field: string;      // field name (e.g., 'map', 'contains')
  value: string;      // display value
  entity?: SearchEntity; // resolved entity for item/fluid/material fields
  rawValue?: string | number; // raw value for numeric/tier fields
}

export type FieldValueType = 'entity' | 'map' | 'tier' | 'number' | 'range' | 'category' | 'cleanroom';

export interface FieldDef {
  name: string;
  description: string;
  valueType: FieldValueType;
}

export const SEARCH_FIELDS: FieldDef[] = [
  { name: 'map', description: 'Recipe map name', valueType: 'map' },
  { name: 'contains', description: 'Item/fluid/material anywhere', valueType: 'entity' },
  { name: 'inputs', description: 'Item/fluid/material in inputs', valueType: 'entity' },
  { name: 'outputs', description: 'Item/fluid/material in outputs', valueType: 'entity' },
  { name: 'exclude', description: 'Exclude recipes containing this', valueType: 'entity' },
  { name: 'exclude-input', description: 'Exclude recipes with this input', valueType: 'entity' },
  { name: 'exclude-output', description: 'Exclude recipes with this output', valueType: 'entity' },
  { name: 'tier', description: 'Voltage tier (ULV, LV, MV, ...)', valueType: 'tier' },
  { name: 'eut', description: 'EU/t value or range', valueType: 'range' },
  { name: 'duration', description: 'Duration in ticks or range', valueType: 'range' },
  { name: 'category', description: 'Material recipe category', valueType: 'category' },
  { name: 'temperature', description: 'Temperature in K or range', valueType: 'range' },
  { name: 'dimension', description: 'Dimension ID', valueType: 'number' },
  { name: 'cleanroom', description: 'Cleanroom requirement', valueType: 'cleanroom' },
];

export const VOLTAGE_TIERS = ['ULV', 'LV', 'MV', 'HV', 'EV', 'IV', 'LuV', 'ZPM', 'UV', 'UHV'] as const;

export const VOLTAGE_TIER_MAX_EUT: Record<string, number> = {
  ULV: 8,
  LV: 32,
  MV: 128,
  HV: 512,
  EV: 2048,
  IV: 8192,
  LuV: 32768,
  ZPM: 131072,
  UV: 524288,
  UHV: 2097152,
};

export const CATEGORY_OPTIONS = ['production', 'interconversion', 'other'] as const;

// Recipe map index: map name -> RecipeRef[]
export type RecipeMapIndex = Record<string, RecipeRef[]>;

// Recipe property index for efficient lookups
export interface RecipePropsIndex {
  cleanroom: Record<string, RecipeRef[]>;
  dimension: Record<string, RecipeRef[]>;
  hasTemperature: RecipeRef[];
  byTier: Record<string, RecipeRef[]>;
}
