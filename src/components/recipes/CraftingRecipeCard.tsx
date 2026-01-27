import { ArrowRight } from 'lucide-react';
import ItemSlot from './ItemSlot';
import type { CraftingRecipe, ShapedRecipe, ShapelessRecipe } from '../../types/recipes';

interface CraftingRecipeCardProps {
  recipe: CraftingRecipe;
}

function CraftingRecipeCard({ recipe }: CraftingRecipeCardProps) {
  const isShapeless = recipe.type === 'shapeless' || recipe.type === 'shapelessOre';

  // Extract ingredients based on recipe type
  const renderShapedGrid = (shapedRecipe: ShapedRecipe) => {
    type GridItem = { resource: string; itemDamage?: number; count?: number } | null;
    const grid: GridItem[][] = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];

    // Parse shape and fill grid
    const shape = shapedRecipe.shape || [];
    shape.forEach((row, rowIdx) => {
      if (rowIdx >= 3) return;
      const chars = row.split('');
      chars.forEach((char, colIdx) => {
        if (colIdx >= 3) return;
        if (char !== ' ' && shapedRecipe.keymap?.[char]) {
          const ingredient = shapedRecipe.keymap[char];
          const firstInput = ingredient.validInputs?.[0];
          if (firstInput) {
            grid[rowIdx][colIdx] = firstInput;
          }
        }
      });
    });

    return (
      <div className="grid grid-cols-3 gap-1">
        {grid.flat().map((item, idx) =>
          item ? (
            <ItemSlot
              key={idx}
              resource={item.resource}
              itemDamage={item.itemDamage ?? 0}
              count={item.count || 1}
            />
          ) : (
            <div
              key={idx}
              className="w-24 h-24 bg-gray-700 border border-gray-600 rounded"
            />
          )
        )}
      </div>
    );
  };

  const renderShapelessIngredients = (shapelessRecipe: ShapelessRecipe) => {
    const ingredients = shapelessRecipe.ingredients || [];

    // If no ingredients, show a message
    if (ingredients.length === 0) {
      return (
        <div className="flex items-center justify-center w-[200px] h-16 text-gray-500 text-sm">
          Ingredients not available
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {ingredients.map((ingredient, idx) => {
          const firstInput = ingredient.validInputs?.[0];
          if (!firstInput) return null;
          return (
            <ItemSlot
              key={idx}
              resource={firstInput.resource}
              itemDamage={firstInput.itemDamage ?? 0}
              count={firstInput.count || 1}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
        <span className="font-medium text-gray-200">
          {isShapeless ? 'Shapeless Crafting' : 'Crafting Table'}
        </span>
      </div>

      {/* Recipe content */}
      <div className="p-4 flex items-center gap-4">
        {/* Inputs */}
        {recipe.recipe ? (
          <>
            {isShapeless
              ? renderShapelessIngredients(recipe.recipe as ShapelessRecipe)
              : renderShapedGrid(recipe.recipe as ShapedRecipe)}
          </>
        ) : (
          <div className="flex items-center justify-center w-[200px] h-16 text-gray-500 text-sm">
            Recipe details not available
          </div>
        )}

        {/* Arrow */}
        <div className="flex-shrink-0 px-2">
          <ArrowRight className="h-8 w-8 text-gray-500" />
        </div>

        {/* Output */}
        <div className="flex items-center justify-center">
          {recipe.output ? (
            <ItemSlot
              resource={recipe.output.resource}
              itemDamage={recipe.output.itemDamage ?? 0}
              count={recipe.output.count || 1}
            />
          ) : (
            <div
              className="w-24 h-24 bg-gray-600 border border-gray-500 rounded flex items-center justify-center"
              title="Output not available"
            >
              <span className="text-gray-400 text-xl">?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CraftingRecipeCard;
