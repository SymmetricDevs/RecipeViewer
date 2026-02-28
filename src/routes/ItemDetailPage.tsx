import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useItemStore } from '../stores/useItemStore';
import { useOreDictStore } from '../stores/useOreDictStore';
import { ArrowLeft } from 'lucide-react';
import RecipeSearchPanel from '../components/search/RecipeSearchPanel';
import { loadItemToMaterial } from '../services/dataLoader';
import type { SearchEntity } from '../types/recipeSearch';

function ItemDetailPage() {
  const { resource, damage } = useParams<{ resource: string; damage: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'input' ? 1 : 0;
  const { items, fetchItems, getItemByResourceAndDamage } = useItemStore();
  const { oreDict, fetchOreDict } = useOreDictStore();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [materialInfo, setMaterialInfo] = useState<{ unlocalizedName: string; localizedName: string; color: number } | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      if (items.length === 0) {
        await fetchItems();
      }
      if (resource && damage) {
        const decodedResource = decodeURIComponent(resource);
        const foundItem = getItemByResourceAndDamage(decodedResource, parseInt(damage));
        setItem(foundItem);
        setLoading(false);
      }
    };
    loadItem();
  }, [resource, damage, items]);

  const searchEntity = useMemo<SearchEntity | undefined>(() => {
    if (!item) return undefined;
    return {
      type: 'item',
      key: `${item.resource}:${item.metadata ?? 0}`,
      displayName: item.displayName,
    };
  }, [item]);

  const tabs = useMemo(() => {
    if (!searchEntity) return undefined;
    return [
      { label: 'As Output', query: { outputs: [searchEntity] } },
      { label: 'As Input', query: { inputs: [searchEntity] } },
    ];
  }, [searchEntity]);

  useEffect(() => {
    const loadMaterialInfo = async () => {
      if (item) {
        try {
          const itemToMat = await loadItemToMaterial();
          const key = `${item.resource}:${item.metadata ?? 0}`;
          setMaterialInfo(itemToMat[key] || null);
        } catch {
          // Material lookup is optional
        }
      }
    };
    loadMaterialInfo();
  }, [item]);

  useEffect(() => {
    fetchOreDict();
  }, [fetchOreDict]);

  // Find oredict entries containing this item
  const oreDictEntries = useMemo(() => {
    if (!item || Object.keys(oreDict).length === 0) return [];
    const itemResource = item.resource;
    const itemMeta = item.metadata ?? 0;
    const entries: string[] = [];
    for (const [name, stacks] of Object.entries(oreDict)) {
      for (const stack of stacks) {
        if (stack.resource === itemResource && (stack.metadata ?? 0) === itemMeta) {
          entries.push(name);
          break;
        }
      }
    }
    return entries;
  }, [item, oreDict]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-400">Item not found</div>
      </div>
    );
  }

  const mod = item.resource.split(':')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/items"
        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Items
      </Link>

      <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
        <div className="flex items-center mb-6">
          {materialInfo && (
            <div
              className="w-2 h-10 rounded-full mr-4 shrink-0"
              style={{ backgroundColor: `#${materialInfo.color.toString(16).padStart(6, '0')}` }}
              title={`Material: ${materialInfo.localizedName}`}
            />
          )}
          <h1 className="text-3xl font-bold text-gray-100">{item.displayName}</h1>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Basic Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Mod</dt>
                <dd className="text-gray-100">{mod}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Resource</dt>
                <dd className="text-gray-100 font-mono text-sm">{item.resource}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Rarity</dt>
                <dd className="text-gray-100">{item.rarity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Max Stack Size</dt>
                <dd className="text-gray-100">{item.maxStackSize}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Additional Properties</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Has Subtypes</dt>
                <dd className="text-gray-100">{item.hasSubtypes ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Max Damage</dt>
                <dd className="text-gray-100">{item.maxDamage}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Translation Key</dt>
                <dd className="text-gray-100 font-mono text-sm">{item.translationKey}</dd>
              </div>
              {materialInfo && (
                <div>
                  <dt className="text-sm font-medium text-gray-400">Material</dt>
                  <dd>
                    <Link
                      to={`/materials/${encodeURIComponent(materialInfo.unlocalizedName)}`}
                      className="text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {materialInfo.localizedName}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {oreDictEntries.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Ore Dictionary ({oreDictEntries.length})
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-wrap gap-2">
                {oreDictEntries.map(name => (
                  <span
                    key={name}
                    className="px-3 py-1 bg-gray-700 text-gray-200 rounded text-sm font-mono"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {searchEntity && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Recipes</h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <RecipeSearchPanel
                contextEntity={searchEntity}
                tabs={tabs}
                defaultTab={initialTab}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetailPage;
