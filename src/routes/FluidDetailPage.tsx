import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useFluidStore } from '../stores/useFluidStore';
import { ArrowLeft } from 'lucide-react';
import RecipeSearchPanel from '../components/search/RecipeSearchPanel';
import { loadFluidToMaterial } from '../services/dataLoader';
import type { SearchEntity } from '../types/recipeSearch';
import { FLUID_COLOR_OVERRIDES } from '../components/fluids/FluidOverrides';


function FluidDetailPage() {
  const { unlocalizedName: urlUnlocalizedName } = useParams<{ unlocalizedName: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'input' ? 1 : 0;
  const { fluids, fetchFluids, getFluidByUnlocalizedName } = useFluidStore();
  const [fluid, setFluid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [materialInfo, setMaterialInfo] = useState<{ unlocalizedName: string; localizedName: string } | null>(null);

  useEffect(() => {
    const loadFluid = async () => {
      if (fluids.length === 0) {
        await fetchFluids();
      }
      if (urlUnlocalizedName) {
        const decodedName = decodeURIComponent(urlUnlocalizedName);
        const foundFluid = getFluidByUnlocalizedName(decodedName);
        setFluid(foundFluid);
        setLoading(false);
      }
    };
    loadFluid();
  }, [urlUnlocalizedName, fluids]);

  const searchEntity = useMemo<SearchEntity | undefined>(() => {
    if (!fluid) return undefined;
    return {
      type: 'fluid',
      key: fluid.unlocalizedName,
      displayName: fluid.localizedName,
    };
  }, [fluid]);

  const tabs = useMemo(() => {
    if (!searchEntity) return undefined;
    return [
      { label: 'As Output', query: { outputs: [searchEntity] } },
      { label: 'As Input', query: { inputs: [searchEntity] } },
    ];
  }, [searchEntity]);

  useEffect(() => {
    const loadMaterialInfo = async () => {
      if (fluid) {
        try {
          const fluidToMat = await loadFluidToMaterial();
          setMaterialInfo(fluidToMat[fluid.unlocalizedName] || null);
        } catch {
          // Material lookup is optional
        }
      }
    };
    loadMaterialInfo();
  }, [fluid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!fluid) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-400">Fluid not found</div>
      </div>
    );
  }

  const color = fluid.fluidColor;
  const colorOverride = FLUID_COLOR_OVERRIDES[fluid.unlocalizedName];
  const hex = colorOverride || `#${color.toString(16).padStart(6, '0')}`;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/fluids"
        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Fluids
      </Link>

      <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
        <div className="flex items-center mb-6">
          <div
            className="w-24 h-24 rounded-lg mr-6 border border-gray-600"
            style={{ backgroundColor: hex }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              {fluid.localizedName}
            </h1>
            <p className="text-gray-400">{fluid.fluidName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Properties</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Temperature</dt>
                <dd className="text-gray-100">{fluid.fluidTemperature}K ({fluid.fluidTemperature - 273}°C)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Density</dt>
                <dd className="text-gray-100">{fluid.fluidDensity} kg/m³</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Viscosity</dt>
                <dd className="text-gray-100">{fluid.fluidViscosity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Luminosity</dt>
                <dd className="text-gray-100">{fluid.fluidLuminosity}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Appearance</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Color (Hex)</dt>
                <dd className="text-gray-100 font-mono">{hex}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Color (Decimal)</dt>
                <dd className="text-gray-100">{color}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Rarity</dt>
                <dd className="text-gray-100">{fluid.fluidRarity}</dd>
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

export default FluidDetailPage;
