# Supersymmetry Recipe Viewer

A web-based recipe viewer for the Supersymmetry (SUSY) Minecraft modpack. Browse through thousands of items, fluids, and recipes without having to open the game.

## Features

- **Item Browser**: Search and browse 10,594+ items with filtering by mod and rarity
- **Fluid Browser**: Explore 563 fluids with their properties and temperatures
- **Recipe Viewer**: View crafting, smelting, and GregTech machine recipes
- **Fast Search**: Quick fuzzy search across items and fluids
- **Responsive Design**: Works on desktop and mobile devices

## Data Statistics

- 10,594 Items
- 563 Fluids
- 152 Recipe Maps
- 6,815 Crafting Recipes
- 647 Smelting Recipes
- 1,629 Machines
- 7,005 Ore Dictionary Entries

## Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Installation

```bash
npm install
```

### Processing Recipe Data

Before building, you need to process the recipe dump from the game:

```bash
npm run process-data
```

This will:
- Load `recipedump.json`
- Split data into manageable chunks
- Compress data with gzip
- Build search indexes

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

Output will be in the `docs/` directory.

### Preview

```bash
npm run preview
```

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions when you push to the `main` branch.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Compression**: pako (gzip)
- **Icons**: Lucide React

## Project Structure

```
susy-recipe-viewer/
├── public/data/           # Processed and compressed JSON data
├── scripts/               # Data processing scripts
├── src/
│   ├── components/        # React components
│   ├── routes/            # Page components
│   ├── services/          # Data loading services
│   ├── stores/            # Zustand state stores
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
└── docs/                  # Build output (GitHub Pages)
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request.
