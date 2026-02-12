import { Link, useNavigate } from 'react-router-dom';
import { useItemStore } from '../../stores/useItemStore';
import { useEffect, useMemo, useState } from 'react';
import type { Item } from '../../types/items';

interface ItemStack {
  resource: string;
  itemDamage?: number;
  count?: number;
  nbt?: { Configuration?: number; [key: string]: unknown };
}

interface ItemSlotProps {
  resource: string;
  itemDamage: number;
  count?: number;
  chance?: number;
  nonConsumable?: boolean;
  className?: string;
  nbt?: { Configuration?: number; [key: string]: unknown };
  // OreDict support
  alternatives?: ItemStack[];
  oreDictName?: string;
}

const CYCLE_INTERVAL_MS = 1000;

function ItemSlot({
  resource,
  itemDamage,
  count = 1,
  chance,
  nonConsumable,
  className = '',
  nbt,
  alternatives,
  oreDictName,
}: ItemSlotProps) {
  const { items, fetchItems } = useItemStore();
  const navigate = useNavigate();
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      fetchItems();
    }
  }, [items.length, fetchItems]);

  // Cycle through alternatives
  useEffect(() => {
    if (!alternatives || alternatives.length <= 1) return;

    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % alternatives.length);
    }, CYCLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [alternatives]);

  // Get current item to display (either from alternatives or from props)
  const currentStack = useMemo(() => {
    if (alternatives && alternatives.length > 0) {
      return alternatives[cycleIndex];
    }
    return { resource, itemDamage, nbt };
  }, [alternatives, cycleIndex, resource, itemDamage, nbt]);

  // Derive item info from items array
  const { item, displayName } = useMemo((): { item: Item | null; displayName: string } => {
    if (items.length === 0) {
      return { item: null, displayName: currentStack.resource.split(':')[1] || currentStack.resource };
    }

    const foundItem = items.find(
      (i) =>
        i.resource === currentStack.resource &&
        (i.itemDamage === (currentStack.itemDamage ?? 0) || (currentStack.itemDamage ?? 0) === 32767)
    );

    if (foundItem) {
      return { item: foundItem, displayName: foundItem.displayName };
    }

    return { item: null, displayName: currentStack.resource.split(':')[1] || currentStack.resource };
  }, [items, currentStack]);

  // Handle right-click to go to "as input" tab
  const handleContextMenu = (e: React.MouseEvent) => {
    if (item) {
      e.preventDefault();
      navigate(`/items/${encodeURIComponent(item.resource)}/${item.itemDamage ?? 0}?tab=input`);
    }
  };

  // Check if this is a Programmed Circuit
  const isProgrammedCircuit = currentStack.resource === 'gregtech:meta_item_1' && (currentStack.itemDamage ?? 0) === 461;
  const circuitConfig = isProgrammedCircuit && currentStack.nbt?.Configuration !== undefined ? currentStack.nbt.Configuration : null;

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

  // Build tooltip for alternatives - completely static, no cycling dependencies
  const alternativesTooltip = useMemo(() => {
    if (!alternatives || alternatives.length <= 1) return null;

    const lines: string[] = [];
    if (oreDictName) {
      lines.push(`OreDict: ${oreDictName}`);
    }
    lines.push(`${alternatives.length} alternatives:`);
    // List all alternatives (limit to first 8 to avoid huge tooltips)
    const displayAlts = alternatives.slice(0, 8);
    for (const alt of displayAlts) {
      const altItem = items.find(
        (i) => i.resource === alt.resource &&
               (i.itemDamage === (alt.itemDamage ?? 0) || (alt.itemDamage ?? 0) === 32767)
      );
      const altName = altItem?.displayName || alt.resource.split(':')[1] || alt.resource;
      lines.push(`  • ${altName}`);
    }
    if (alternatives.length > 8) {
      lines.push(`  ... and ${alternatives.length - 8} more`);
    }
    if (count > 1) {
      lines.push(`Amount: ${count}`);
    }
    if (nonConsumable) {
      lines.push(`(Not consumed)`);
    }
    return lines.join('\n');
  }, [alternatives, oreDictName, items, count, nonConsumable]);

  // Build tooltip for single items - can depend on cycling values since it won't cycle
  const singleItemTooltip = useMemo(() => {
    if (alternatives && alternatives.length > 1) return null;

    const lines: string[] = [];
    lines.push(`${displayName}${count > 1 ? ` x${count}` : ''}${chance ? ` (${(chance / 100).toFixed(1)}%)` : ''}${nonConsumable ? ' (Catalyst)' : ''}`);
    lines.push(`${resource}:${itemDamage}`);
    return lines.join('\n');
  }, [alternatives, displayName, count, chance, nonConsumable, resource, itemDamage]);

  const tooltip = alternativesTooltip || singleItemTooltip || '';

  const hasAlternatives = alternatives && alternatives.length > 1;

  const content = (
    <div
      className={`
        relative flex items-center justify-center
        w-24 h-24 bg-gray-700 border border-gray-600 rounded
        hover:border-cyan-400 transition-colors
        ${nonConsumable ? 'ring-2 ring-yellow-500' : ''}
        ${hasAlternatives ? 'ring-1 ring-purple-500' : ''}
        ${className}
      `}
      title={tooltip}
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

      {/* OreDict indicator */}
      {hasAlternatives && (
        <span className="absolute top-1 left-1 text-[10px] text-purple-400 font-bold">
          ⟳
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

  if (item) {
    return (
      <Link
        to={`/items/${encodeURIComponent(item.resource)}/${item.itemDamage ?? 0}`}
        className="block"
        onContextMenu={handleContextMenu}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default ItemSlot;
