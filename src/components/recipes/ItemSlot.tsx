import { Link } from 'react-router-dom';
import { useItemStore } from '../../stores/useItemStore';
import { useEffect, useMemo } from 'react';

interface ItemSlotProps {
  resource: string;
  itemDamage: number;
  count?: number;
  chance?: number;
  nonConsumable?: boolean;
  className?: string;
  nbt?: { Configuration?: number; [key: string]: unknown };
}

function ItemSlot({
  resource,
  itemDamage,
  count = 1,
  chance,
  nonConsumable,
  className = '',
  nbt,
}: ItemSlotProps) {
  const { items, fetchItems } = useItemStore();

  useEffect(() => {
    if (items.length === 0) {
      fetchItems();
    }
  }, [items.length, fetchItems]);

  // Derive item info from items array
  const { itemIndex, displayName } = useMemo(() => {
    if (items.length === 0) {
      return { itemIndex: null, displayName: resource.split(':')[1] || resource };
    }

    const idx = items.findIndex(
      (item) =>
        item.resource === resource &&
        (item.itemDamage === itemDamage || itemDamage === 32767)
    );

    if (idx !== -1) {
      return { itemIndex: idx, displayName: items[idx].displayName };
    }

    return { itemIndex: null, displayName: resource.split(':')[1] || resource };
  }, [items, resource, itemDamage]);

  // Check if this is a Programmed Circuit
  const isProgrammedCircuit = resource === 'gregtech:meta_item_1' && itemDamage === 461;
  const circuitConfig = isProgrammedCircuit && nbt?.Configuration !== undefined ? nbt.Configuration : null;

  // Only truncate very long names
  const shortName = useMemo(() => {
    if (!displayName) return '?';
    // For programmed circuits, show shorter name to make room for config
    if (isProgrammedCircuit && circuitConfig !== null) {
      return 'Programmed Circuit #' + circuitConfig;
    }
    if (displayName.length <= 32) return displayName;
    return displayName.substring(0, 30) + '...';
  }, [displayName, isProgrammedCircuit, circuitConfig]);

  const content = (
    <div
      className={`
        relative flex items-center justify-center
        w-24 h-24 bg-gray-700 border border-gray-600 rounded
        hover:border-cyan-400 transition-colors
        ${nonConsumable ? 'ring-2 ring-yellow-500' : ''}
        ${className}
      `}
      title={`${displayName}${count > 1 ? ` x${count}` : ''}${chance ? ` (${(chance / 100).toFixed(1)}%)` : ''}${nonConsumable ? ' (Catalyst)' : ''}\n${resource}:${itemDamage}`}
    >
      {/* Item name */}
      <div className="text-xs text-gray-300 text-center leading-tight px-1.5 break-words">
        {shortName}
      </div>

      {/* Non-consumable indicator */}
      {nonConsumable && (
        <span className="absolute top-1 left-1 text-[10px] text-yellow-400 font-bold">
          NC
        </span>
      )}

      {/* Chance badge */}
      {chance !== undefined && (
        <span className="absolute top-1 right-1 text-[10px] font-bold text-yellow-400 bg-gray-900/80 px-1 rounded">
          {(chance / 100).toFixed(0)}%
        </span>
      )}

      {/* Count badge */}
      {count > 1 && (
        <span className="absolute bottom-1 right-1 text-xs font-bold text-white bg-gray-900/80 px-1 rounded">
          {count}
        </span>
      )}
    </div>
  );

  if (itemIndex !== null) {
    return (
      <Link to={`/items/${itemIndex}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default ItemSlot;
