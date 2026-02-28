import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMaterialStore } from '../stores/useMaterialStore';
import { useItemStore } from '../stores/useItemStore';
import { useFluidStore } from '../stores/useFluidStore';
import { ArrowLeft } from 'lucide-react';
import RecipeSearchPanel from '../components/search/RecipeSearchPanel';
import type { Material } from '../types/materials';
import type { SearchEntity } from '../types/recipeSearch';

function MaterialDetailPage() {
  const { unlocalizedName: urlName } = useParams<{ unlocalizedName: string }>();
  const { materials, fetchMaterials, getMaterialByUnlocalizedName } = useMaterialStore();
  const { items, fetchItems, getItemByResourceAndDamage } = useItemStore();
  const { fluids, fetchFluids, getFluidByUnlocalizedName } = useFluidStore();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaterial = async () => {
      if (materials.length === 0) {
        await fetchMaterials();
      }
      if (urlName) {
        const decodedName = decodeURIComponent(urlName);
        const found = getMaterialByUnlocalizedName(decodedName);
        setMaterial(found);
        setLoading(false);
      }
    };
    loadMaterial();
  }, [urlName, materials]);

  useEffect(() => {
    if (material) {
      if (material.items && material.items.length > 0 && items.length === 0) {
        fetchItems();
      }
      if (material.fluids && material.fluids.length > 0 && fluids.length === 0) {
        fetchFluids();
      }
    }
  }, [material]);

  const searchEntity = useMemo<SearchEntity | undefined>(() => {
    if (!material) return undefined;
    return {
      type: 'material',
      key: material.unlocalizedName,
      displayName: material.localizedName,
    };
  }, [material]);

  const tabs = useMemo(() => {
    if (!searchEntity) return undefined;
    return [
      { label: 'Production', query: { category: 'production' as const, contains: [searchEntity] } },
      { label: 'Interconversion', query: { category: 'interconversion' as const, contains: [searchEntity] } },
      { label: 'Other', query: { category: 'other' as const, contains: [searchEntity] } },
      { label: 'All', query: { contains: [searchEntity] }},
      { label: 'As Output', query: { outputs: [searchEntity] }},
      { label: 'As Input', query: { inputs: [searchEntity] }}
    ];
  }, [searchEntity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-400">Material not found</div>
      </div>
    );
  }

  const hex = `#${material.color.toString(16).padStart(6, '0')}`;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/materials"
        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Materials
      </Link>

      <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div
            className="w-16 h-16 rounded-lg mr-6 border border-gray-600"
            style={{ backgroundColor: hex }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{material.localizedName}</h1>
            {material.chemicalFormula && (
              <p className="text-lg text-gray-400 font-mono">{material.chemicalFormula}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Basic properties */}
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Properties</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Mod</dt>
                <dd className="text-gray-100">{material.modId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Resource</dt>
                <dd className="text-gray-100 font-mono text-sm">{material.resource}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Mass</dt>
                <dd className="text-gray-100">{material.mass}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Protons</dt>
                <dd className="text-gray-100">{material.protons}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Neutrons</dt>
                <dd className="text-gray-100">{material.neutrons}</dd>
              </div>
              {material.isRadioactive && (
                <div>
                  <dd className="inline-block px-2 py-1 bg-yellow-900 text-yellow-200 rounded text-sm font-medium">
                    Radioactive
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-400">Color</dt>
                <dd className="text-gray-100 font-mono flex items-center gap-2">
                  {hex}
                  <span className="inline-block w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: hex }} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Conditional property panels */}
          <div className="space-y-6">
            {material.tool && (
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Tool Properties</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Harvest Level</dt>
                    <dd className="text-gray-100">{material.tool.harvestLevel}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Mining Speed</dt>
                    <dd className="text-gray-100">{material.tool.miningSpeed}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Attack Damage</dt>
                    <dd className="text-gray-100">{material.tool.attackDamage}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Durability</dt>
                    <dd className="text-gray-100">{material.tool.durability}</dd>
                  </div>
                </dl>
              </div>
            )}

            {material.pipe && (
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Pipe Properties</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Throughput</dt>
                    <dd className="text-gray-100">{material.pipe.throughput} L/s</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Max Temperature</dt>
                    <dd className="text-gray-100">{material.pipe.maxTemperature}K</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Resistances</dt>
                    <dd className="text-gray-100 flex gap-2 flex-wrap">
                      {material.pipe.gasProof && <span className="px-2 py-0.5 bg-green-900 text-green-200 rounded text-xs">Gas</span>}
                      {material.pipe.acidProof && <span className="px-2 py-0.5 bg-green-900 text-green-200 rounded text-xs">Acid</span>}
                      {material.pipe.cryoProof && <span className="px-2 py-0.5 bg-green-900 text-green-200 rounded text-xs">Cryo</span>}
                      {material.pipe.plasmaProof && <span className="px-2 py-0.5 bg-green-900 text-green-200 rounded text-xs">Plasma</span>}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {material.wire && (
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Wire Properties</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Voltage</dt>
                    <dd className="text-gray-100">{material.wire.voltage} EU/t</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Amperage</dt>
                    <dd className="text-gray-100">{material.wire.amperage}A</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Loss per Block</dt>
                    <dd className="text-gray-100">{material.wire.lossPerBlock} EU/t</dd>
                  </div>
                  {material.wire.isSuperconductor && (
                    <div>
                      <dd className="inline-block px-2 py-1 bg-blue-900 text-blue-200 rounded text-sm font-medium">
                        Superconductor
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {!material.tool && !material.pipe && !material.wire && (
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Additional Properties</h2>
                <p className="text-gray-500">No tool, pipe, or wire properties</p>
              </div>
            )}
          </div>
        </div>

        {/* Associated Fluids */}
        {material.fluids && material.fluids.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Associated Fluids ({material.fluids.length})
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-wrap gap-2">
                {material.fluids.map((fluidName) => {
                  const fluid = getFluidByUnlocalizedName(fluidName);
                  return (
                    <Link
                      key={fluidName}
                      to={`/fluids/${encodeURIComponent(fluidName)}`}
                      className="px-3 py-1 bg-gray-700 text-cyan-400 hover:bg-gray-600 rounded transition text-sm"
                    >
                      {fluid?.localizedName || fluidName}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Associated Items */}
        {material.items && material.items.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Associated Items ({material.items.length})
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-wrap gap-2">
                {material.items.map((itemKey) => {
                  // Item key format: "mod:name:metadata"
                  const lastColon = itemKey.lastIndexOf(':');
                  const resource = itemKey.substring(0, lastColon);
                  const damage = itemKey.substring(lastColon + 1);
                  const item = getItemByResourceAndDamage(resource, parseInt(damage));
                  return (
                    <Link
                      key={itemKey}
                      to={`/items/${encodeURIComponent(resource)}/${damage || '0'}`}
                      className="px-3 py-1 bg-gray-700 text-cyan-400 hover:bg-gray-600 rounded transition text-sm"
                    >
                      {item?.displayName || itemKey}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recipes */}
        {searchEntity && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Recipes</h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <RecipeSearchPanel
                contextEntity={searchEntity}
                tabs={tabs}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialDetailPage;
