import { Link } from 'react-router-dom';
import { useFluidStore } from '../../stores/useFluidStore';
import { useEffect, useMemo } from 'react';

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

  useEffect(() => {
    if (fluids.length === 0) {
      fetchFluids();
    }
  }, [fluids.length, fetchFluids]);

  // Derive fluid info from fluids array
  const { fluidIndex, displayName, color, hasCustomTexture } = useMemo(() => {
    if (fluids.length === 0) {
      return {
        fluidIndex: null,
        displayName: localizedName || unlocalizedName.replace('fluid.', ''),
        color: '#3b82f6',
        hasCustomTexture: false,
      };
    }

    const idx = fluids.findIndex(
      (fluid) => fluid.unlocalizedName === unlocalizedName
    );

    if (idx !== -1) {
      const fluid = fluids[idx];
      const colorInt = fluid.fluidColor;
      return {
        fluidIndex: idx,
        displayName: fluid.localizedName || localizedName || unlocalizedName.replace('fluid.', ''),
        color: `#${colorInt.toString(16).padStart(6, '0')}`,
        hasCustomTexture: fluid.hasCustomTexture || false,
      };
    }

    return {
      fluidIndex: null,
      displayName: localizedName || unlocalizedName.replace('fluid.', ''),
      color: '#3b82f6',
      hasCustomTexture: false,
    };
  }, [fluids, unlocalizedName, localizedName]);

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

  if (fluidIndex !== null) {
    return (
      <Link to={`/fluids/${fluidIndex}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default FluidSlot;
