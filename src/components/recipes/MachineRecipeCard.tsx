import { ArrowRight, Zap, Clock } from 'lucide-react';
import ItemSlot from './ItemSlot';
import FluidSlot from './FluidSlot';
import type { Recipe } from '../../types/recipes';

interface MachineRecipeCardProps {
  recipe: Recipe;
  mapName: string;
}

function MachineRecipeCard({ recipe, mapName }: MachineRecipeCardProps) {
  // Format duration in ticks to seconds
  const formatDuration = (ticks: number): string => {
    const seconds = ticks / 20;
    if (seconds < 1) {
      return `${ticks}t`;
    }
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // Format EU/t
  const formatEU = (eut: number): string => {
    if (Math.abs(eut) >= 1000000) {
      return `${(eut / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(eut) >= 1000) {
      return `${(eut / 1000).toFixed(1)}K`;
    }
    return eut.toString();
  };

  // Get display name from map name
  const displayMapName = mapName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-750 border-b border-gray-700">
        <span className="font-medium text-gray-200">{displayMapName}</span>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            {formatEU(recipe.EUt)} EU/t
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-cyan-400" />
            {formatDuration(recipe.duration)}
          </span>
        </div>
      </div>

      {/* Recipe content */}
      <div className="p-4 flex items-center gap-4">
        {/* Inputs */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-medium mb-2">Inputs</div>
          <div className="flex flex-wrap gap-1">
            {/* Item inputs */}
            {recipe.inputs?.map((input, idx) => {
              const stack = input.inputStacks?.[0];
              if (!stack?.resource) return null;
              return (
                <ItemSlot
                  key={`item-${idx}`}
                  resource={stack.resource}
                  itemDamage={stack.itemDamage ?? 0}
                  count={input.amount || stack.count || 1}
                  nonConsumable={input.nonConsumable}
                  nbt={stack.nbt}
                />
              );
            })}
            {/* Fluid inputs */}
            {recipe.inputsFluid?.map((input, idx) => {
              const fluidStack = input.inputFluidStack;
              if (!fluidStack?.unlocalizedName) return null;
              return (
                <FluidSlot
                  key={`fluid-${idx}`}
                  unlocalizedName={fluidStack.unlocalizedName}
                  amount={fluidStack.amount}
                  localizedName={fluidStack.specificLocalizedName}
                />
              );
            })}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center px-2">
          <ArrowRight className="h-8 w-8 text-gray-500" />
        </div>

        {/* Outputs */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-medium mb-2">Outputs</div>
          <div className="flex flex-wrap gap-1">
            {/* Item outputs */}
            {recipe.outputs?.map((output, idx) => (
              <ItemSlot
                key={`out-${idx}`}
                resource={output.resource}
                itemDamage={output.itemDamage ?? 0}
                count={output.count || 1}
              />
            ))}
            {recipe.chancedOutputs?.map((output, idx) => (
              <ItemSlot
                key={`chanced-${idx}`}
                resource={output.resource}
                itemDamage={output.itemDamage ?? 0}
                count={output.count || 1}
                chance={output.chance}
              />
            ))}
            {/* Fluid outputs */}
            {recipe.fluidOutputs?.map((output, idx) => (
              <FluidSlot
                key={`fluidout-${idx}`}
                unlocalizedName={output.unlocalizedName}
                amount={output.amount}
                localizedName={output.specificLocalizedName}
              />
            ))}
            {recipe.chancedFluidOutputs?.map((output, idx) => (
              <FluidSlot
                key={`chancedfluid-${idx}`}
                unlocalizedName={output.unlocalizedName}
                amount={output.amount}
                localizedName={output.specificLocalizedName}
                chance={output.chance}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MachineRecipeCard;
