import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECIPE_DUMP_PATH = path.join(__dirname, '../recipedump.json');
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const RECIPEMAPS_DIR = path.join(OUTPUT_DIR, 'recipemaps');
const INDEXES_DIR = path.join(OUTPUT_DIR, 'indexes');

interface RecipeDump {
  items: any[];
  fluids: any[];
  oreDict: Record<string, any[]>;
  recipemaps: Record<string, any>;
  crafting: any[];
  smelting: any[];
  gtMTEs: Record<string, any>;
}

// Recipe index types
interface RecipeRef {
  type: 'crafting' | 'smelting' | 'machine';
  index: number;
  map?: string;
}

interface RecipeIndexEntry {
  asInput: RecipeRef[];
  asOutput: RecipeRef[];
}

type ItemRecipeIndex = Record<string, RecipeIndexEntry>;
type FluidRecipeIndex = Record<string, RecipeIndexEntry>;

// Helper to create item key from resource and damage
function makeItemKey(resource: string, itemDamage: number): string {
  return `${resource}:${itemDamage}`;
}

// Helper to ensure an entry exists in the index
function ensureIndexEntry(index: Record<string, RecipeIndexEntry>, key: string): RecipeIndexEntry {
  if (!index[key]) {
    index[key] = { asInput: [], asOutput: [] };
  }
  return index[key];
}

// Add item to index with wildcard handling
function addItemToIndex(
  index: ItemRecipeIndex,
  resource: string,
  itemDamage: number,
  ref: RecipeRef,
  asOutput: boolean
): void {
  const key = makeItemKey(resource, itemDamage);
  const entry = ensureIndexEntry(index, key);

  if (asOutput) {
    entry.asOutput.push(ref);
  } else {
    entry.asInput.push(ref);
  }

  // Also add wildcard entry (32767) to index for lookup purposes
  if (itemDamage === 32767) {
    // This is already a wildcard, no need to duplicate
  }
}

// Build item and fluid recipe indexes
function buildRecipeIndexes(data: RecipeDump): { itemIndex: ItemRecipeIndex; fluidIndex: FluidRecipeIndex } {
  const itemIndex: ItemRecipeIndex = {};
  const fluidIndex: FluidRecipeIndex = {};

  // Process smelting recipes
  console.log('  Indexing smelting recipes...');
  data.smelting.forEach((recipe, index) => {
    const ref: RecipeRef = { type: 'smelting', index };

    // Input
    if (recipe.input?.resource) {
      addItemToIndex(itemIndex, recipe.input.resource, recipe.input.itemDamage ?? 0, ref, false);
    }

    // Output
    if (recipe.output?.resource) {
      addItemToIndex(itemIndex, recipe.output.resource, recipe.output.itemDamage ?? 0, ref, true);
    }
  });

  // Process crafting recipes
  console.log('  Indexing crafting recipes...');
  data.crafting.forEach((recipe, index) => {
    const ref: RecipeRef = { type: 'crafting', index };

    // Index output
    if (recipe.output?.resource) {
      addItemToIndex(itemIndex, recipe.output.resource, recipe.output.itemDamage ?? 0, ref, true);
    }

    if (recipe.recipe) {
      // Shaped recipe - has keymap
      if (recipe.recipe.keymap) {
        for (const ingredient of Object.values(recipe.recipe.keymap) as any[]) {
          if (ingredient.validInputs) {
            for (const input of ingredient.validInputs) {
              if (input.resource) {
                addItemToIndex(itemIndex, input.resource, input.itemDamage ?? 0, ref, false);
              }
            }
          }
          // Check for fluid ingredients
          if (ingredient.fluid?.unlocalizedName) {
            const fluidKey = ingredient.fluid.unlocalizedName;
            const entry = ensureIndexEntry(fluidIndex, fluidKey);
            entry.asInput.push(ref);
          }
        }
      }

      // Shapeless recipe - has ingredients array
      if (recipe.recipe.ingredients) {
        for (const ingredient of recipe.recipe.ingredients) {
          if (ingredient.validInputs) {
            for (const input of ingredient.validInputs) {
              if (input.resource) {
                addItemToIndex(itemIndex, input.resource, input.itemDamage ?? 0, ref, false);
              }
            }
          }
          if (ingredient.fluid?.unlocalizedName) {
            const fluidKey = ingredient.fluid.unlocalizedName;
            const entry = ensureIndexEntry(fluidIndex, fluidKey);
            entry.asInput.push(ref);
          }
        }
      }
    }
  });

  // Process machine recipes
  console.log('  Indexing machine recipes...');
  for (const [mapName, mapData] of Object.entries(data.recipemaps)) {
    const recipes = (mapData as any).recipes || [];

    recipes.forEach((recipe: any, index: number) => {
      const ref: RecipeRef = { type: 'machine', map: mapName, index };

      // Item inputs
      if (recipe.inputs) {
        for (const input of recipe.inputs) {
          if (input.inputStacks) {
            for (const stack of input.inputStacks) {
              if (stack.resource) {
                addItemToIndex(itemIndex, stack.resource, stack.itemDamage ?? 0, ref, false);
              }
            }
          }
        }
      }

      // Fluid inputs
      if (recipe.inputsFluid) {
        for (const input of recipe.inputsFluid) {
          if (input.inputFluidStack?.unlocalizedName) {
            const fluidKey = input.inputFluidStack.unlocalizedName;
            const entry = ensureIndexEntry(fluidIndex, fluidKey);
            entry.asInput.push(ref);
          }
        }
      }

      // Item outputs
      if (recipe.outputs) {
        for (const output of recipe.outputs) {
          if (output.resource) {
            addItemToIndex(itemIndex, output.resource, output.itemDamage ?? 0, ref, true);
          }
        }
      }

      // Chanced item outputs
      if (recipe.chancedOutputs) {
        for (const output of recipe.chancedOutputs) {
          if (output.resource) {
            addItemToIndex(itemIndex, output.resource, output.itemDamage ?? 0, ref, true);
          }
        }
      }

      // Fluid outputs
      if (recipe.fluidOutputs) {
        for (const output of recipe.fluidOutputs) {
          if (output.unlocalizedName) {
            const fluidKey = output.unlocalizedName;
            const entry = ensureIndexEntry(fluidIndex, fluidKey);
            entry.asOutput.push(ref);
          }
        }
      }

      // Chanced fluid outputs
      if (recipe.chancedFluidOutputs) {
        for (const output of recipe.chancedFluidOutputs) {
          if (output.unlocalizedName) {
            const fluidKey = output.unlocalizedName;
            const entry = ensureIndexEntry(fluidIndex, fluidKey);
            entry.asOutput.push(ref);
          }
        }
      }
    });
  }

  return { itemIndex, fluidIndex };
}

// Create output directories
function ensureDirectories() {
  [OUTPUT_DIR, RECIPEMAPS_DIR, INDEXES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Compress and write JSON file
function writeCompressed(filePath: string, data: any) {
  const json = JSON.stringify(data);
  const compressed = gzipSync(json);
  fs.writeFileSync(filePath + '.gz', compressed);
  console.log(`✓ ${path.basename(filePath)}.gz (${(compressed.length / 1024).toFixed(2)} KB, ${((1 - compressed.length / json.length) * 100).toFixed(1)}% compression)`);
}

// Convert ARGB color to RGB hex string
// -1 (0xFFFFFFFF) means custom texture - return null to indicate this
function convertARGBColor(argb: number): { rgb: number; hasCustomTexture: boolean } {
  // Handle -1 / 0xFFFFFFFF (custom texture)
  if (argb === -1 || argb === 0xFFFFFFFF) {
    return { rgb: 0x808080, hasCustomTexture: true }; // Gray placeholder
  }

  // Convert signed 32-bit int to unsigned if negative
  const unsigned = argb >>> 0;

  // Extract RGB from ARGB (ignore alpha channel)
  const rgb = unsigned & 0x00FFFFFF;

  return { rgb, hasCustomTexture: false };
}

// Process fluids to fix color format
function processFluids(fluids: any[]): any[] {
  return fluids.map(fluid => {
    const { rgb, hasCustomTexture } = convertARGBColor(fluid.fluidColor);
    return {
      ...fluid,
      fluidColor: rgb,
      hasCustomTexture,
    };
  });
}

// Build search indexes for items
function buildItemIndex(items: any[]) {
  return items.map((item, index) => ({
    id: index,
    displayName: item.displayName,
    resource: item.resource,
    translationKey: item.translationKey,
    rarity: item.rarity,
  }));
}

// Build search indexes for fluids
function buildFluidIndex(fluids: any[]) {
  return fluids.map((fluid, index) => ({
    id: index,
    fluidName: fluid.fluidName,
    localizedName: fluid.localizedName,
    unlocalizedName: fluid.unlocalizedName,
  }));
}

async function processRecipeDump() {
  console.log('Starting recipe dump processing...\n');

  // Check if source file exists
  if (!fs.existsSync(RECIPE_DUMP_PATH)) {
    console.error(`Error: recipedump.json not found at ${RECIPE_DUMP_PATH}`);
    console.error('Please run /recipemapdump in-game first.');
    process.exit(1);
  }

  // Ensure output directories exist
  ensureDirectories();

  // Load the recipe dump
  console.log('Loading recipedump.json...');
  const data: RecipeDump = JSON.parse(fs.readFileSync(RECIPE_DUMP_PATH, 'utf-8'));
  console.log('✓ Loaded successfully\n');

  // Statistics
  const stats = {
    items: data.items.length,
    fluids: data.fluids.length,
    recipemaps: Object.keys(data.recipemaps).length,
    crafting: data.crafting.length,
    smelting: data.smelting.length,
    machines: Object.keys(data.gtMTEs).length,
    oreDict: Object.keys(data.oreDict).length,
  };

  console.log('Data Statistics:');
  console.log(`  Items: ${stats.items.toLocaleString()}`);
  console.log(`  Fluids: ${stats.fluids.toLocaleString()}`);
  console.log(`  Recipe Maps: ${stats.recipemaps.toLocaleString()}`);
  console.log(`  Crafting Recipes: ${stats.crafting.toLocaleString()}`);
  console.log(`  Smelting Recipes: ${stats.smelting.toLocaleString()}`);
  console.log(`  Machines: ${stats.machines.toLocaleString()}`);
  console.log(`  Ore Dictionary Entries: ${stats.oreDict.toLocaleString()}`);
  console.log('');

  // Split and compress data
  console.log('Processing data files:');

  // Items
  writeCompressed(path.join(OUTPUT_DIR, 'items.json'), data.items);

  // Fluids (with color conversion from ARGB to RGB)
  const processedFluids = processFluids(data.fluids);
  writeCompressed(path.join(OUTPUT_DIR, 'fluids.json'), processedFluids);

  // Ore Dictionary
  writeCompressed(path.join(OUTPUT_DIR, 'oreDict.json'), data.oreDict);

  // Crafting
  writeCompressed(path.join(OUTPUT_DIR, 'crafting.json'), data.crafting);

  // Smelting
  writeCompressed(path.join(OUTPUT_DIR, 'smelting.json'), data.smelting);

  // Machines
  writeCompressed(path.join(OUTPUT_DIR, 'machines.json'), data.gtMTEs);

  console.log('');

  // Process recipe maps
  console.log('Processing recipe maps:');
  const recipemapFiles: string[] = [];

  for (const [mapName, mapData] of Object.entries(data.recipemaps)) {
    const fileName = `${mapName}.json`;
    const filePath = path.join(RECIPEMAPS_DIR, fileName);
    writeCompressed(filePath, mapData);
    recipemapFiles.push(fileName);
  }

  // Create recipe map manifest
  const manifest = {
    count: recipemapFiles.length,
    maps: recipemapFiles.map(file => file.replace('.json', '')),
  };
  writeCompressed(path.join(RECIPEMAPS_DIR, 'manifest.json'), manifest);

  console.log('');

  // Build search indexes
  console.log('Building search indexes:');
  const itemSearchIndex = buildItemIndex(data.items);
  writeCompressed(path.join(INDEXES_DIR, 'search-items.json'), itemSearchIndex);

  const fluidSearchIndex = buildFluidIndex(data.fluids);
  writeCompressed(path.join(INDEXES_DIR, 'search-fluids.json'), fluidSearchIndex);

  console.log('');

  // Build recipe indexes
  console.log('Building recipe indexes:');
  const { itemIndex: itemRecipeIndex, fluidIndex: fluidRecipeIndex } = buildRecipeIndexes(data);

  const itemIndexStats = {
    totalItems: Object.keys(itemRecipeIndex).length,
    totalRefs: Object.values(itemRecipeIndex).reduce(
      (sum, entry) => sum + entry.asInput.length + entry.asOutput.length,
      0
    ),
  };
  writeCompressed(path.join(INDEXES_DIR, 'recipe-index-items.json'), itemRecipeIndex);
  console.log(`    Items indexed: ${itemIndexStats.totalItems.toLocaleString()}, refs: ${itemIndexStats.totalRefs.toLocaleString()}`);

  const fluidIndexStats = {
    totalFluids: Object.keys(fluidRecipeIndex).length,
    totalRefs: Object.values(fluidRecipeIndex).reduce(
      (sum, entry) => sum + entry.asInput.length + entry.asOutput.length,
      0
    ),
  };
  writeCompressed(path.join(INDEXES_DIR, 'recipe-index-fluids.json'), fluidRecipeIndex);
  console.log(`    Fluids indexed: ${fluidIndexStats.totalFluids.toLocaleString()}, refs: ${fluidIndexStats.totalRefs.toLocaleString()}`);

  console.log('');

  // Create metadata file
  const metadata = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats,
  };
  writeCompressed(path.join(OUTPUT_DIR, 'metadata.json'), metadata);

  console.log('Processing complete! ✨');
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

// Run the processing
processRecipeDump().catch(error => {
  console.error('Error processing recipe dump:', error);
  process.exit(1);
});
