import type { RecipeRef, LoadedRecipe, RecipeIndexEntry, MaterialRecipeIndexEntry } from '../types/recipeIndex';
import type { RecipeQuery, SearchEntity, RangeValue } from '../types/recipeSearch';
import {
  loadItemRecipeIndex,
  loadFluidRecipeIndex,
  loadMaterialRecipeIndex,
  loadRecipeMapIndex,
  loadRecipePropsIndex,
} from './dataLoader';
import { useRecipeStore } from '../stores/useRecipeStore';
import type { Recipe } from '../types/recipes';

function serializeRef(ref: RecipeRef): string {
  return `${ref.type}:${ref.map || ''}:${ref.index}`;
}

function getRefsForEntity(
  entity: SearchEntity,
  side: 'asInput' | 'asOutput' | 'both',
  itemIndex: Record<string, RecipeIndexEntry>,
  fluidIndex: Record<string, RecipeIndexEntry>,
  materialIndex: Record<string, MaterialRecipeIndexEntry>,
): RecipeRef[] {
  const refs: RecipeRef[] = [];

  if (entity.type === 'item') {
    const entry = itemIndex[entity.key];
    if (entry) {
      if (side === 'asInput' || side === 'both') refs.push(...entry.asInput);
      if (side === 'asOutput' || side === 'both') refs.push(...entry.asOutput);
    }
  } else if (entity.type === 'fluid') {
    const entry = fluidIndex[entity.key];
    if (entry) {
      if (side === 'asInput' || side === 'both') refs.push(...entry.asInput);
      if (side === 'asOutput' || side === 'both') refs.push(...entry.asOutput);
    }
  } else if (entity.type === 'material') {
    const entry = materialIndex[entity.key];
    if (entry) {
      // Material refs are already classified; for contains/input/output we use all
      refs.push(...entry.production, ...entry.interconversion, ...entry.other);
    }
  }

  return refs;
}

function intersectRefSets(sets: Set<string>[]): Set<string> {
  if (sets.length === 0) return new Set();
  if (sets.length === 1) return sets[0];

  // Start with the smallest set for efficiency
  const sorted = [...sets].sort((a, b) => a.size - b.size);
  const result = new Set<string>();

  for (const key of sorted[0]) {
    if (sorted.every(s => s.has(key))) {
      result.add(key);
    }
  }

  return result;
}

function refsToSet(refs: RecipeRef[]): Set<string> {
  const set = new Set<string>();
  for (const ref of refs) {
    set.add(serializeRef(ref));
  }
  return set;
}

function deserializeRef(key: string): RecipeRef {
  const parts = key.split(':');
  const type = parts[0] as RecipeRef['type'];
  const map = parts[1] || undefined;
  const index = parseInt(parts[2], 10);
  return { type, map: map || undefined, index };
}

function matchesRange(value: number, range: RangeValue): boolean {
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

function getRecipeTemperature(recipe: Recipe): number | undefined {
  if (!recipe.properties) return undefined;
  for (const prop of recipe.properties) {
    if (prop.temperature !== undefined) return prop.temperature;
  }
  return undefined;
}

export async function executeQuery(query: RecipeQuery): Promise<LoadedRecipe[]> {
  // Load all needed indexes in parallel
  const [itemIndex, fluidIndex, materialIndex, recipeMapIndex, propsIndex] = await Promise.all([
    loadItemRecipeIndex(),
    loadFluidRecipeIndex(),
    loadMaterialRecipeIndex(),
    loadRecipeMapIndex(),
    loadRecipePropsIndex(),
  ]);

  const candidateSets: Set<string>[] = [];

  // Map filter
  if (query.maps && query.maps.length > 0) {
    const mapRefs: RecipeRef[] = [];
    for (const mapName of query.maps) {
      const refs = recipeMapIndex[mapName];
      if (refs) mapRefs.push(...refs);
    }
    candidateSets.push(refsToSet(mapRefs));
  }

  // Contains filter (item/fluid/material appears anywhere)
  if (query.contains && query.contains.length > 0) {
    for (const entity of query.contains) {
      const refs = getRefsForEntity(entity, 'both', itemIndex, fluidIndex, materialIndex);
      candidateSets.push(refsToSet(refs));
    }
  }

  // Inputs filter
  if (query.inputs && query.inputs.length > 0) {
    for (const entity of query.inputs) {
      const refs = getRefsForEntity(entity, 'asInput', itemIndex, fluidIndex, materialIndex);
      candidateSets.push(refsToSet(refs));
    }
  }

  // Outputs filter
  if (query.outputs && query.outputs.length > 0) {
    for (const entity of query.outputs) {
      const refs = getRefsForEntity(entity, 'asOutput', itemIndex, fluidIndex, materialIndex);
      candidateSets.push(refsToSet(refs));
    }
  }

  // Tier filter
  if (query.tier) {
    const tierRefs = propsIndex.byTier[query.tier];
    candidateSets.push(refsToSet(tierRefs || []));
  }

  // Cleanroom filter
  if (query.cleanroom) {
    if (query.cleanroom === 'any') {
      // Union all cleanroom refs
      const allCleanroomRefs: RecipeRef[] = [];
      for (const refs of Object.values(propsIndex.cleanroom)) {
        allCleanroomRefs.push(...refs);
      }
      candidateSets.push(refsToSet(allCleanroomRefs));
    } else {
      const refs = propsIndex.cleanroom[query.cleanroom];
      candidateSets.push(refsToSet(refs || []));
    }
  }

  // Dimension filter
  if (query.dimension !== undefined) {
    const refs = propsIndex.dimension[String(query.dimension)];
    candidateSets.push(refsToSet(refs || []));
  }

  // Category filter (requires material context)
  if (query.category) {
    // Find a material entity from contains/inputs/outputs
    const materialEntities: SearchEntity[] = [];
    for (const list of [query.contains, query.inputs, query.outputs]) {
      if (list) {
        for (const e of list) {
          if (e.type === 'material') materialEntities.push(e);
        }
      }
    }
    if (materialEntities.length > 0) {
      const categoryRefs: RecipeRef[] = [];
      for (const matEntity of materialEntities) {
        const entry = materialIndex[matEntity.key];
        if (entry) {
          categoryRefs.push(...entry[query.category]);
        }
      }
      candidateSets.push(refsToSet(categoryRefs));
    }
  }

  // If no candidate sets yet but we have numeric post-filters that only apply to
  // machine recipes, use all machine recipes as the starting candidate set
  const hasNumericFilters = query.eut || query.duration || query.temperature;
  if (candidateSets.length === 0 && hasNumericFilters) {
    const allMachineRefs: RecipeRef[] = [];
    for (const [mapName, refs] of Object.entries(recipeMapIndex)) {
      if (mapName !== 'crafting' && mapName !== 'smelting') {
        allMachineRefs.push(...refs);
      }
    }
    candidateSets.push(refsToSet(allMachineRefs));
  }

  // If no filters were applied, return empty (don't return everything)
  if (candidateSets.length === 0) {
    return [];
  }

  // Intersect all candidate sets
  const resultSet = intersectRefSets(candidateSets);

  // Subtract exclusion sets
  if (query.excludes && query.excludes.length > 0) {
    for (const entity of query.excludes) {
      const refs = getRefsForEntity(entity, 'both', itemIndex, fluidIndex, materialIndex);
      const excludeSet = refsToSet(refs);
      for (const key of excludeSet) {
        resultSet.delete(key);
      }
    }
  }

  if (query.excludeInputs && query.excludeInputs.length > 0) {
    for (const entity of query.excludeInputs) {
      const refs = getRefsForEntity(entity, 'asInput', itemIndex, fluidIndex, materialIndex);
      const excludeSet = refsToSet(refs);
      for (const key of excludeSet) {
        resultSet.delete(key);
      }
    }
  }

  if (query.excludeOutputs && query.excludeOutputs.length > 0) {
    for (const entity of query.excludeOutputs) {
      const refs = getRefsForEntity(entity, 'asOutput', itemIndex, fluidIndex, materialIndex);
      const excludeSet = refsToSet(refs);
      for (const key of excludeSet) {
        resultSet.delete(key);
      }
    }
  }

  // Convert back to RecipeRefs and load details
  const refs = [...resultSet].map(deserializeRef);
  const { loadRecipeDetails } = useRecipeStore.getState();
  const loaded = await loadRecipeDetails(refs);

  // Post-filter on numeric ranges (eut, duration, temperature)
  let filtered = loaded;

  if (query.eut) {
    const range = query.eut;
    filtered = filtered.filter(lr => {
      if (lr.ref.type !== 'machine') return false;
      const recipe = lr.recipe as Recipe;
      return matchesRange(Math.abs(recipe.EUt), range);
    });
  }

  if (query.duration) {
    const range = query.duration;
    filtered = filtered.filter(lr => {
      if (lr.ref.type !== 'machine') return false;
      const recipe = lr.recipe as Recipe;
      return matchesRange(recipe.duration, range);
    });
  }

  if (query.temperature) {
    const range = query.temperature;
    filtered = filtered.filter(lr => {
      if (lr.ref.type !== 'machine') return false;
      const recipe = lr.recipe as Recipe;
      const temp = getRecipeTemperature(recipe);
      if (temp === undefined) return false;
      return matchesRange(temp, range);
    });
  }

  return filtered;
}

/**
 * Parse a range string like "128", "128..512", "128..", "..512" into a RangeValue.
 */
export function parseRange(input: string): RangeValue | null {
  const trimmed = input.trim();
  if (trimmed.includes('..')) {
    const [minStr, maxStr] = trimmed.split('..');
    const min = minStr.trim() ? parseInt(minStr.trim(), 10) : undefined;
    const max = maxStr.trim() ? parseInt(maxStr.trim(), 10) : undefined;
    if ((min !== undefined && isNaN(min)) || (max !== undefined && isNaN(max))) return null;
    return { min, max };
  }
  const val = parseInt(trimmed, 10);
  if (isNaN(val)) return null;
  return { min: val, max: val };
}
