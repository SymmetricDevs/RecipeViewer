import { Link, useNavigate } from 'react-router-dom';
import { useFluidStore } from '../../stores/useFluidStore';
import { useEffect, useMemo } from 'react';
import { FLUID_COLOR_OVERRIDES } from '../fluids/FluidOverrides';

interface FluidSlotProps {
  unlocalizedName: string;
  amount: number;
  localizedName?: string;
  chance?: number;
  className?: string;
}

function FluidSlot({
  unlocalizedName,
  amount,
  localizedName,
  chance,
  className = '',
}: FluidSlotProps) {
  const { fluids, fetchFluids } = useFluidStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (fluids.length === 0) {
      fetchFluids();
    }
  }, [fluids.length, fetchFluids]);

  // Derive fluid info from fluids array
  const { displayName, color, hasCustomTexture, fluid } = useMemo(() => {
    // Check for color override first
    const colorOverride = FLUID_COLOR_OVERRIDES[unlocalizedName];

    if (fluids.length === 0) {
      return {
        displayName: localizedName || unlocalizedName.replace('fluid.', ''),
        color: colorOverride || '#3b82f6',
        hasCustomTexture: false,
        fluid: null,
      };
    }

    const foundFluid = fluids.find(
      (f) => f.unlocalizedName === unlocalizedName
    );

    if (foundFluid) {
      const colorInt = foundFluid.fluidColor;
      return {
        displayName: foundFluid.localizedName || localizedName || unlocalizedName.replace('fluid.', ''),
        color: colorOverride || `#${colorInt.toString(16).padStart(6, '0')}`,
        // If we have a color override, don't use custom texture styling
        hasCustomTexture: colorOverride ? false : (foundFluid.hasCustomTexture || false),
        fluid: foundFluid,
      };
    }

    return {
      displayName: localizedName || unlocalizedName.replace('fluid.', ''),
      color: colorOverride || '#3b82f6',
      hasCustomTexture: false,
      fluid: null,
    };
  }, [fluids, unlocalizedName, localizedName]);

  // Handle right-click to go to "as input" tab
  const handleContextMenu = (e: React.MouseEvent) => {
    if (fluid) {
      e.preventDefault();
      navigate(`/fluids/${encodeURIComponent(fluid.unlocalizedName)}?tab=input`);
    }
  };

  // Format amount (mB)
  const formatAmount = (mb: number): string => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(mb % 1000 === 0 ? 0 : 1)}B`;
    }
    return `${mb}mB`;
  };

  // Only truncate very long names
  const shortName = useMemo(() => {
    if (!displayName) return '?';
    if (displayName.length <= 28) return displayName;
    return displayName.substring(0, 26) + '...';
  }, [displayName]);

  const content = (
    <div
      className={`
        relative flex items-center justify-center
        w-24 h-24 border border-gray-600 rounded
        hover:border-cyan-400 transition-colors
        ${hasCustomTexture ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-600' : ''}
        ${className}
      `}
      style={hasCustomTexture ? undefined : { backgroundColor: color + '40' }}
      title={`${displayName} (${amount}mB)${chance ? ` (${(chance / 100).toFixed(1)}%)` : ''}${hasCustomTexture ? ' (Custom Texture)' : ''}\n${unlocalizedName}`}
    >
      {/* Fluid color indicator */}
      {!hasCustomTexture && (
        <div
          className="absolute inset-1.5 rounded opacity-40"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Name */}
      <div className="relative text-xs text-white text-center leading-tight px-1.5 font-medium z-10 break-words">
        {shortName}
      </div>

      {/* Amount badge */}
      <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-gray-900/80 px-1 rounded z-10">
        {formatAmount(amount)}
      </span>

      {/* Chance badge */}
      {chance !== undefined && (
        <span className="absolute top-1 right-1 text-[10px] font-bold text-yellow-400 bg-gray-900/80 px-1 rounded z-10">
          {(chance / 100).toFixed(0)}%
        </span>
      )}
    </div>
  );

  if (fluid) {
    return (
      <Link
        to={`/fluids/${encodeURIComponent(fluid.unlocalizedName)}`}
        className="block"
        onContextMenu={handleContextMenu}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default FluidSlot;
