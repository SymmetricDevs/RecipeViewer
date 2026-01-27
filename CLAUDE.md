# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Susy Recipe Viewer is a web-based recipe browser for the Supersymmetry Minecraft modpack. It displays items, fluids, and recipes from the game without requiring Minecraft to be running.

## Commands

```bash
npm run dev              # Start development server
npm run build            # TypeScript check + Vite build
npm run lint             # Run ESLint
npm run preview          # Preview production build
npm run process-data     # Process recipedump.json into compressed chunks
```

**Important**: Run `npm run process-data` before building if `public/data/` is missing. This processes the 37MB `recipedump.json` into gzipped chunks.

## Architecture

### Data Flow
1. `recipedump.json` (game dump) → `npm run process-data` → compressed `.json.gz` files in `public/data/`
2. Browser loads compressed data via `dataLoader.ts` → decompresses with pako → cached in memory
3. Zustand stores (`useItemStore`, `useFluidStore`, `useRecipeStore`) manage state with reactive filtering
4. Recipe lookup: Detail pages → `getRecipesForItem/Fluid` → loads recipe indexes → fetches recipe details from cached maps

### Key Directories

#### `src/routes/` - Page Components
- `HomePage.tsx` - Landing page with statistics and navigation cards
- `ItemsPage.tsx` - List view of all items with search functionality
- `ItemDetailPage.tsx` - Detailed view of a single item with recipes
- `FluidsPage.tsx` - List view of all fluids with properties display
- `FluidDetailPage.tsx` - Detailed view of a single fluid with recipes

#### `src/components/` - Reusable Components
- **`layout/`** - Layout components
  - `Header.tsx` - Navigation header with links to Items/Fluids sections
- **`recipes/`** - Recipe display components
  - `RecipeList.tsx` - Main recipe container with tabbed interface (Output/Input) and pagination (25 recipes per page)
  - `MachineRecipeCard.tsx` - Displays GregTech machine recipes with EU/t and duration formatting
  - `CraftingRecipeCard.tsx` - Displays vanilla crafting recipes (shaped & shapeless)
  - `SmeltingRecipeCard.tsx` - Displays furnace smelting recipes
  - `ItemSlot.tsx` - Displays item slots with count, chance, and catalyst indicators
  - `FluidSlot.tsx` - Displays fluid slots with amount formatting (mB/B)
  - `index.ts` - Barrel export file for recipe components

#### `src/stores/` - Zustand State Management
- `useItemStore.ts` - Global item data store with search/filter/mod/rarity logic
- `useFluidStore.ts` - Global fluid data store with search/filter logic
- `useRecipeStore.ts` - Global recipe data store with recipe fetching and caching

#### `src/types/` - TypeScript Interfaces
- `items.ts` - Item and ItemStack types, ItemWithDisplay, ChancedOutput
- `fluids.ts` - Fluid and FluidStack types, ChancedFluidOutput
- `recipes.ts` - Recipe types (GTRecipeInput, Recipe, RecipeMap, CraftingRecipe, SmeltingRecipe, Machine, RecipeDump)
- `recipeIndex.ts` - Recipe indexing types (RecipeRef, RecipeIndexEntry, ItemRecipeIndex, FluidRecipeIndex, LoadedRecipe, RecipesForItem/Fluid)

#### `src/services/` - Data Services
- `dataLoader.ts` - Data fetching with gzip decompression and caching
  - Generic loader: `loadCompressedJSON<T>()`
  - Specific loaders: `loadItems()`, `loadFluids()`, `loadOreDict()`, `loadCrafting()`, `loadSmelting()`, `loadMachines()`, `loadRecipeMap()`, `loadRecipeMapManifest()`, `loadItemSearchIndex()`, `loadFluidSearchIndex()`, `loadMetadata()`, `loadItemRecipeIndex()`, `loadFluidRecipeIndex()`

#### `scripts/` - Data Processing
- `process-recipedump.ts` - Main data processing pipeline
  - Reads `recipedump.json` from game dump
  - Builds item and fluid recipe indexes with wildcard handling
  - Compresses all data files with gzip
  - Creates recipe map manifest
  - Generates search indexes for items and fluids
  - Outputs to `public/data/` directory

#### `public/data/` - Generated Compressed Data (gitignored)
- **Root level**: `items.json.gz`, `fluids.json.gz`, `oreDict.json.gz`, `crafting.json.gz`, `smelting.json.gz`, `machines.json.gz`, `metadata.json.gz`
- **`recipemaps/`**: Individual recipe map files (`{mapname}.json.gz`) for each GregTech recipe map + `manifest.json.gz`
- **`indexes/`**: `search-items.json.gz`, `search-fluids.json.gz`, `recipe-index-items.json.gz`, `recipe-index-fluids.json.gz`

### Routing
Uses React Router v7 with base path `/susy-recipe-viewer/` for GitHub Pages deployment.
- `/` - Home page
- `/items` - Items list page
- `/items/:id` - Item detail page with recipes
- `/fluids` - Fluids list page
- `/fluids/:id` - Fluid detail page with recipes

### Build Output
Builds to `docs/` directory for GitHub Pages. Vite config sets custom middleware to handle gzipped content properly.

## Recipe System

The recipe system uses an indexing approach:
- **Item key format**: `"resource:itemDamage"` (supports wildcards at damage 32767)
- **Fluid key format**: `"unlocalizedName"`
- **Each entry tracks**: `asInput` (consumed by recipes) and `asOutput` (produced by recipes)
- **Recipe types**: Machine (GregTech), Crafting (vanilla shaped/shapeless), Smelting (furnace)

## Tech Stack
- React 19 + TypeScript 5.9 (strict mode)
- Vite 6 (build tool)
- Zustand 5 (state management)
- Tailwind CSS 4 (styling)
- React Router 7 (navigation)
- pako 2.1 (gzip decompression)
- Lucide React 0.563 (icons)

## Conventions
- **Component Organization**: Page components in `routes/`, reusable in `components/`
- **Store Pattern**: Zustand stores with get/set pattern, lazy-loading with fetch functions
- **Type Safety**: All components fully typed
- **Performance**: Gzip compression, in-memory caching, pagination (25 recipes per page), search debouncing (300ms)
- **Styling**: Tailwind CSS utility classes, gray-800 background, blue accents

## Deployment
GitHub Actions workflow on push to main: installs deps → processes data → builds → deploys to GitHub Pages.
