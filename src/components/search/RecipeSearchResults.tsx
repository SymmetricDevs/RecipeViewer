import type { LoadedRecipe } from '../../types/recipeIndex';
import type { Recipe, CraftingRecipe, SmeltingRecipe } from '../../types/recipes';
import MachineRecipeCard from '../recipes/MachineRecipeCard';
import CraftingRecipeCard from '../recipes/CraftingRecipeCard';
import SmeltingRecipeCard from '../recipes/SmeltingRecipeCard';

interface RecipeSearchResultsProps {
  results: LoadedRecipe[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  page: number;
  onPageChange: (page: number) => void;
  hasQuery: boolean;
}

const RECIPES_PER_PAGE = 25;

function renderRecipe(loaded: LoadedRecipe, index: number) {
  const { ref, recipe, mapName } = loaded;

  switch (ref.type) {
    case 'machine':
      return (
        <MachineRecipeCard
          key={`machine-${ref.map}-${ref.index}-${index}`}
          recipe={recipe as Recipe}
          mapName={mapName || ref.map || 'Unknown'}
        />
      );
    case 'crafting':
      return (
        <CraftingRecipeCard
          key={`crafting-${ref.index}-${index}`}
          recipe={recipe as CraftingRecipe}
        />
      );
    case 'smelting':
      return (
        <SmeltingRecipeCard
          key={`smelting-${ref.index}-${index}`}
          recipe={recipe as SmeltingRecipe}
        />
      );
    default:
      return null;
  }
}

function RecipeSearchResults({ results, loading, error, totalResults, page, onPageChange, hasQuery }: RecipeSearchResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Searching recipes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!hasQuery) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Add search filters to find recipes</div>
      </div>
    );
  }

  if (totalResults === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No recipes match your search</div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / RECIPES_PER_PAGE);
  const startIndex = (page - 1) * RECIPES_PER_PAGE;
  const endIndex = Math.min(startIndex + RECIPES_PER_PAGE, totalResults);
  const paginatedRecipes = results.slice(startIndex, endIndex);

  return (
    <div>
      <div className="text-sm text-gray-400 mb-3">
        {totalResults} recipe{totalResults !== 1 ? 's' : ''} found
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {paginatedRecipes.map((loaded, idx) => renderRecipe(loaded, startIndex + idx))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded transition-colors ${
              page === 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages} ({startIndex + 1}-{endIndex} of {totalResults})
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded transition-colors ${
              page === totalPages
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeSearchResults;
