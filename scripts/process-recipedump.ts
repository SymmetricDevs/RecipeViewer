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
    fluidLocalizedName: fluid.fluidLocalizedName,
    fluidUnlocalizedName: fluid.fluidUnlocalizedName,
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

  // Fluids
  writeCompressed(path.join(OUTPUT_DIR, 'fluids.json'), data.fluids);

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
  const itemIndex = buildItemIndex(data.items);
  writeCompressed(path.join(INDEXES_DIR, 'search-items.json'), itemIndex);

  const fluidIndex = buildFluidIndex(data.fluids);
  writeCompressed(path.join(INDEXES_DIR, 'search-fluids.json'), fluidIndex);

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
