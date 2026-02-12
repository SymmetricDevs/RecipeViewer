import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gunzipSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const DATA_DIR = path.join(DOCS_DIR, 'data');
const INDEXES_DIR = path.join(DATA_DIR, 'indexes');

const BASE_URL = 'https://symmetricdevs.github.io/RecipeViewer';

interface Item {
  displayName: string;
  resource: string;
  itemDamage?: number;
}

interface Fluid {
  fluidName: string;
  unlocalizedName: string;
  localizedName: string;
}

interface RecipeIndexEntry {
  asInput: unknown[];
  asOutput: unknown[];
}

type ItemRecipeIndex = Record<string, RecipeIndexEntry>;
type FluidRecipeIndex = Record<string, RecipeIndexEntry>;
type OreDict = Record<string, { resource: string; itemDamage?: number }[]>;

// Load compressed JSON file
function loadCompressedJSON<T>(filePath: string): T {
  const compressed = fs.readFileSync(filePath);
  const decompressed = gunzipSync(compressed);
  return JSON.parse(decompressed.toString());
}

// Escape HTML special characters for use in meta tag content
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Build reverse oreDict lookup: item key -> oreDict names
function buildReverseOreDict(oreDict: OreDict): Map<string, string[]> {
  const reverse = new Map<string, string[]>();

  for (const [oreDictName, items] of Object.entries(oreDict)) {
    for (const item of items) {
      const key = `${item.resource}:${item.itemDamage ?? 0}`;
      const existing = reverse.get(key) || [];
      existing.push(oreDictName);
      reverse.set(key, existing);
    }
  }

  return reverse;
}

// Generate OG meta tags HTML
function generateOGTags(
  title: string,
  description: string,
  url: string
): string {
  return `
    <!-- Open Graph meta tags for social media previews -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SUSY Recipe Viewer" />
    <meta name="twitter:card" content="summary" />`;
}

// Inject OG tags into HTML template
function injectOGTags(template: string, ogTags: string, title: string): string {
  // Try to replace existing OG meta tags block first
  const ogPattern = /\s*<!-- Open Graph meta tags for social media previews -->[\s\S]*?<meta name="twitter:card" content="summary" \/>/;
  let result: string;

  if (ogPattern.test(template)) {
    // Replace existing OG tags
    result = template.replace(ogPattern, ogTags);
  } else {
    // Insert OG tags after the title tag
    result = template.replace(/<\/title>/, `</title>${ogTags}`);
  }

  // Update the title
  result = result.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

  return result;
}

// Ensure directory exists
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateOGPages() {
  console.log('Starting OG pages generation...\n');

  // Check if docs directory exists (build must have run first)
  if (!fs.existsSync(DOCS_DIR)) {
    console.error('Error: docs/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error('Error: docs/data/ directory not found. Run `npm run process-data` and `npm run build` first.');
    process.exit(1);
  }

  // Load the built index.html as template
  const templatePath = path.join(DOCS_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('Error: docs/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Load data files
  console.log('Loading data files...');
  const items: Item[] = loadCompressedJSON(path.join(DATA_DIR, 'items.json.gz'));
  const fluids: Fluid[] = loadCompressedJSON(path.join(DATA_DIR, 'fluids.json.gz'));
  const oreDict: OreDict = loadCompressedJSON(path.join(DATA_DIR, 'oreDict.json.gz'));
  const itemRecipeIndex: ItemRecipeIndex = loadCompressedJSON(path.join(INDEXES_DIR, 'recipe-index-items.json.gz'));
  const fluidRecipeIndex: FluidRecipeIndex = loadCompressedJSON(path.join(INDEXES_DIR, 'recipe-index-fluids.json.gz'));

  console.log(`  Items: ${items.length.toLocaleString()}`);
  console.log(`  Fluids: ${fluids.length.toLocaleString()}`);
  console.log(`  OreDict entries: ${Object.keys(oreDict).length.toLocaleString()}`);
  console.log('');

  // Build reverse oreDict lookup
  console.log('Building reverse oreDict lookup...');
  const reverseOreDict = buildReverseOreDict(oreDict);
  console.log(`  Indexed ${reverseOreDict.size.toLocaleString()} item keys\n`);

  // Create output directories
  const itemsDir = path.join(DOCS_DIR, 'items');
  const fluidsDir = path.join(DOCS_DIR, 'fluids');
  ensureDir(itemsDir);
  ensureDir(fluidsDir);

  // Generate items list page
  console.log('Generating list pages...');
  const itemsListOG = generateOGTags(
    'Items - SUSY Recipe Viewer',
    `Browse ${items.length.toLocaleString()} items from the Supersymmetry Minecraft modpack`,
    `${BASE_URL}/items`
  );
  const itemsListHtml = injectOGTags(template, itemsListOG, 'Items - SUSY Recipe Viewer');
  fs.writeFileSync(path.join(itemsDir, 'index.html'), itemsListHtml);

  // Generate fluids list page
  const fluidsListOG = generateOGTags(
    'Fluids - SUSY Recipe Viewer',
    `Browse ${fluids.length.toLocaleString()} fluids from the Supersymmetry Minecraft modpack`,
    `${BASE_URL}/fluids`
  );
  const fluidsListHtml = injectOGTags(template, fluidsListOG, 'Fluids - SUSY Recipe Viewer');
  fs.writeFileSync(path.join(fluidsDir, 'index.html'), fluidsListHtml);
  console.log('  Created /items/index.html and /fluids/index.html\n');

  // Generate individual item pages
  console.log('Generating item detail pages...');
  let itemCount = 0;
  const itemErrors: string[] = [];

  for (const item of items) {
    try {
      const resource = item.resource;
      const damage = item.itemDamage ?? 0;
      const itemKey = `${resource}:${damage}`;

      // Get recipe counts
      const recipeEntry = itemRecipeIndex[itemKey];
      const inputCount = recipeEntry?.asInput?.length ?? 0;
      const outputCount = recipeEntry?.asOutput?.length ?? 0;

      // Get oreDict names for this item
      const oreDictNames = reverseOreDict.get(itemKey) || [];
      const oreDictStr = oreDictNames.length > 0
        ? `OreDicts: ${oreDictNames.slice(0, 3).join(', ')}${oreDictNames.length > 3 ? '...' : ''}`
        : '';

      // Build description
      const descParts = [`${resource}:${damage}`];
      if (oreDictStr) descParts.push(oreDictStr);
      descParts.push(`Used in ${inputCount} recipes, produced by ${outputCount} recipes`);
      const description = descParts.join(' | ');

      // URL-encode the resource for og:url (handles colons and special chars)
      const encodedResource = encodeURIComponent(resource);
      const url = `${BASE_URL}/items/${encodedResource}/${damage}`;

      // Generate OG tags
      const title = `${item.displayName} - SUSY Recipe Viewer`;
      const ogTags = generateOGTags(title, description, url);
      const html = injectOGTags(template, ogTags, title);

      // Create directory structure: items/{resource}/
      // Use raw resource name - GitHub Pages decodes URL-encoded requests
      const itemDir = path.join(itemsDir, resource);
      ensureDir(itemDir);

      // Write file: items/{resource}/{damage}.html
      fs.writeFileSync(path.join(itemDir, `${damage}.html`), html);
      itemCount++;

      if (itemCount % 5000 === 0) {
        console.log(`  Progress: ${itemCount.toLocaleString()} / ${items.length.toLocaleString()} items`);
      }
    } catch (err) {
      itemErrors.push(`${item.resource}: ${err}`);
    }
  }
  console.log(`  Generated ${itemCount.toLocaleString()} item pages`);
  if (itemErrors.length > 0) {
    console.log(`  Errors: ${itemErrors.length} (first few: ${itemErrors.slice(0, 3).join('; ')})`);
  }
  console.log('');

  // Generate individual fluid pages
  console.log('Generating fluid detail pages...');
  let fluidCount = 0;
  const fluidErrors: string[] = [];

  for (const fluid of fluids) {
    try {
      const unlocalizedName = fluid.unlocalizedName;

      // Get recipe counts
      const recipeEntry = fluidRecipeIndex[unlocalizedName];
      const inputCount = recipeEntry?.asInput?.length ?? 0;
      const outputCount = recipeEntry?.asOutput?.length ?? 0;

      // Build description
      const description = `${unlocalizedName} | Used in ${inputCount} recipes, produced by ${outputCount} recipes`;

      // URL-encode the unlocalized name for og:url
      const encodedName = encodeURIComponent(unlocalizedName);
      const url = `${BASE_URL}/fluids/${encodedName}`;

      // Generate OG tags
      const title = `${fluid.localizedName} - SUSY Recipe Viewer`;
      const ogTags = generateOGTags(title, description, url);
      const html = injectOGTags(template, ogTags, title);

      // Write file: fluids/{unlocalizedName}.html
      // Use raw name - GitHub Pages decodes URL-encoded requests
      fs.writeFileSync(path.join(fluidsDir, `${unlocalizedName}.html`), html);
      fluidCount++;

      if (fluidCount % 500 === 0) {
        console.log(`  Progress: ${fluidCount.toLocaleString()} / ${fluids.length.toLocaleString()} fluids`);
      }
    } catch (err) {
      fluidErrors.push(`${fluid.unlocalizedName}: ${err}`);
    }
  }
  console.log(`  Generated ${fluidCount.toLocaleString()} fluid pages`);
  if (fluidErrors.length > 0) {
    console.log(`  Errors: ${fluidErrors.length} (first few: ${fluidErrors.slice(0, 3).join('; ')})`);
  }
  console.log('');

  console.log('OG pages generation complete! ✨');
  console.log(`\nSummary:`);
  console.log(`  Item pages: ${itemCount.toLocaleString()}`);
  console.log(`  Fluid pages: ${fluidCount.toLocaleString()}`);
  console.log(`  Total HTML files: ${(itemCount + fluidCount + 2).toLocaleString()}`);
}

// Run the generation
generateOGPages().catch(error => {
  console.error('Error generating OG pages:', error);
  process.exit(1);
});
