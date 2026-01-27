import { ArrowRight, Flame } from 'lucide-react';
import ItemSlot from './ItemSlot';
import type { SmeltingRecipe } from '../../types/recipes';

interface SmeltingRecipeCardProps {
  recipe: SmeltingRecipe;
}

function SmeltingRecipeCard({ recipe }: SmeltingRecipeCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
        <span className="font-medium text-gray-200 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Furnace
        </span>
      </div>

      {/* Recipe content */}
      <div className="p-4 flex items-center gap-4">
        {/* Input */}
        {recipe.input?.resource ? (
          <ItemSlot
            resource={recipe.input.resource}
            itemDamage={recipe.input.itemDamage ?? 0}
            count={recipe.input.count || 1}
          />
        ) : (
          <div className="w-24 h-24 bg-gray-700 border border-gray-600 rounded flex items-center justify-center">
            <span className="text-gray-400">?</span>
          </div>
        )}

        {/* Arrow */}
        <div className="flex-shrink-0 px-2">
          <ArrowRight className="h-8 w-8 text-gray-500" />
        </div>

        {/* Output */}
        {recipe.output?.resource ? (
          <ItemSlot
            resource={recipe.output.resource}
            itemDamage={recipe.output.itemDamage ?? 0}
            count={recipe.output.count || 1}
          />
        ) : (
          <div className="w-24 h-24 bg-gray-700 border border-gray-600 rounded flex items-center justify-center">
            <span className="text-gray-400">?</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmeltingRecipeCard;
