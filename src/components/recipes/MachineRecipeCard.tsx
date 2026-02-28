import { useEffect } from 'react';
import { ArrowRight, Zap, Clock, Thermometer, Sparkles, Grid3X3, Globe } from 'lucide-react';
import ItemSlot from './ItemSlot';
import FluidSlot from './FluidSlot';
import type { Recipe, RecipeProperty } from '../../types/recipes';
import { useOreDictStore } from '../../stores/useOreDictStore';

interface MachineRecipeCardProps {
  recipe: Recipe;
  mapName: string;
}

function MachineRecipeCard({ recipe, mapName }: MachineRecipeCardProps) {
  const { fetchOreDict, getOreDictName } = useOreDictStore();

  useEffect(() => {
    fetchOreDict();
  }, [fetchOreDict]);

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

  // Get display name from map name
  const displayMapName = mapName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Collect displayable properties
  const propertyBadges: { icon: typeof Zap; color: string; label: string }[] = [];
  if (recipe.properties) {
    for (const prop of recipe.properties as RecipeProperty[]) {
      switch (prop.propertyKey) {
        case 'temperature':
          if (prop.temperature)
            propertyBadges.push({
              icon: Thermometer, color: 'text-orange-400',
              label: `${prop.temperature.toLocaleString()}K (${prop.temperature - 273}\u00B0C)`,
            });
          break;
        case 'cleanroom':
          if (prop.cleanroom)
            propertyBadges.push({
              icon: Sparkles, color: 'text-purple-400',
              label: prop.cleanroom.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            });
          break;
        case 'eu_to_start':
          if (prop.eu_to_start)
            propertyBadges.push({
              icon: Zap, color: 'text-red-400',
              label: `${prop.eu_to_start.toLocaleString()} EU to start`,
            });
          break;
        case 'mixer_settler_cells':
          if (prop.cells)
            propertyBadges.push({
              icon: Grid3X3, color: 'text-teal-400',
              label: `${prop.cells} cell${prop.cells !== 1 ? 's' : ''}`,
            });
          break;
        case 'dimension':
          if (prop.dimensions && prop.dimensions.length > 0)
            propertyBadges.push({
              icon: Globe, color: 'text-green-400',
              label: `Dim ${prop.dimensions.join(', ')}`,
            });
          break;
      }
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-750 border-b border-gray-700">
        <span className="font-medium text-gray-200">{displayMapName}</span>
        <div
          className="flex items-center gap-4 text-sm text-gray-400"
          title={`Total: ${(Math.abs(recipe.EUt) * recipe.duration).toLocaleString()} EU`}
        >
          <span className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            {recipe.EUt} EU/t
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-cyan-400" />
            {formatDuration(recipe.duration)}
          </span>
        </div>
      </div>

      {/* Recipe properties */}
      {propertyBadges.length > 0 && (
        <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-gray-700 bg-gray-800">
          {propertyBadges.map((badge, idx) => (
            <span key={idx} className={`flex items-center gap-1 text-xs ${badge.color}`}>
              <badge.icon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          ))}
        </div>
      )}

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

              // Get oreDict name if this input uses an oreDict
              const oreDictIndex = input.oreDict;
              const oreDictName = oreDictIndex !== undefined && oreDictIndex >= 0
                ? getOreDictName(oreDictIndex)
                : undefined;

              // Get alternatives if there are multiple inputStacks
              const alternatives = input.inputStacks && input.inputStacks.length > 1
                ? input.inputStacks
                : undefined;

              return (
                <ItemSlot
                  key={`item-${idx}`}
                  resource={stack.resource}
                  metadata={stack.metadata ?? 0}
                  count={input.amount || stack.count || 1}
                  nonConsumable={input.nonConsumable}
                  nbt={stack.nbt}
                  alternatives={alternatives}
                  oreDictName={oreDictName}
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
                metadata={output.metadata ?? 0}
                count={output.count || 1}
              />
            ))}
            {recipe.chancedOutputs?.map((output, idx) => (
              <ItemSlot
                key={`chanced-${idx}`}
                resource={output.resource}
                metadata={output.metadata ?? 0}
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
