import { useState, useEffect } from 'react';
import type { LoadedRecipe } from '../../types/recipeIndex';
import type { Recipe, CraftingRecipe, SmeltingRecipe } from '../../types/recipes';
import MachineRecipeCard from './MachineRecipeCard';
import CraftingRecipeCard from './CraftingRecipeCard';
import SmeltingRecipeCard from './SmeltingRecipeCard';

interface RecipeListProps {
  asInput: LoadedRecipe[];
  asOutput: LoadedRecipe[];
  loading?: boolean;
  error?: string | null;
  initialTab?: 'output' | 'input';
}

type Tab = 'output' | 'input';

const RECIPES_PER_PAGE = 25;

function RecipeList({ asInput, asOutput, loading, error, initialTab = 'output' }: RecipeListProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync activeTab with initialTab when it changes (e.g., from URL query param)
  useEffect(() => {
    setActiveTab(initialTab);
    setCurrentPage(1);
  }, [initialTab]);

  const renderRecipe = (loaded: LoadedRecipe, index: number) => {
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading recipes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">Error loading recipes: {error}</div>
      </div>
    );
  }

  const totalRecipes = asInput.length + asOutput.length;

  if (totalRecipes === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No recipes found</div>
      </div>
    );
  }

  const activeRecipes = activeTab === 'output' ? asOutput : asInput;

  // Pagination calculations
  const totalRecipesInTab = activeRecipes.length;
  const totalPages = Math.ceil(totalRecipesInTab / RECIPES_PER_PAGE);
  const startIndex = (currentPage - 1) * RECIPES_PER_PAGE;
  const endIndex = Math.min(startIndex + RECIPES_PER_PAGE, totalRecipesInTab);
  const paginatedRecipes = activeRecipes.slice(startIndex, endIndex);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'output'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => handleTabChange('output')}
        >
          As Output ({asOutput.length})
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'input'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => handleTabChange('input')}
        >
          As Input ({asInput.length})
        </button>
      </div>

      {/* Recipe list */}
      {activeRecipes.length === 0 ? (
        <div className="text-gray-500 py-4">
          No recipes where this is {activeTab === 'output' ? 'produced' : 'used'}
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {paginatedRecipes.map((loaded, idx) => renderRecipe(loaded, startIndex + idx))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages} ({startIndex + 1}-{endIndex} of {totalRecipesInTab})
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RecipeList;
