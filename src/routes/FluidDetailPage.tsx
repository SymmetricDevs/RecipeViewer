import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFluidStore } from '../stores/useFluidStore';
import { ArrowLeft } from 'lucide-react';

function FluidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { fluids, fetchFluids, getFluidById } = useFluidStore();
  const [fluid, setFluid] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFluid = async () => {
      if (fluids.length === 0) {
        await fetchFluids();
      }
      if (id) {
        const foundFluid = getFluidById(parseInt(id));
        setFluid(foundFluid);
        setLoading(false);
      }
    };
    loadFluid();
  }, [id, fluids]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!fluid) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-600">Fluid not found</div>
      </div>
    );
  }

  const color = fluid.fluidColor;
  const hex = `#${color.toString(16).padStart(6, '0')}`;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/fluids"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Fluids
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center mb-6">
          <div
            className="w-24 h-24 rounded-lg mr-6 border border-gray-300"
            style={{ backgroundColor: hex }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {fluid.fluidLocalizedName}
            </h1>
            <p className="text-gray-500">{fluid.fluidName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Properties</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                <dd className="text-gray-800">{fluid.fluidTemperature}K ({fluid.fluidTemperature - 273}°C)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Density</dt>
                <dd className="text-gray-800">{fluid.fluidDensity} kg/m³</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Viscosity</dt>
                <dd className="text-gray-800">{fluid.fluidViscosity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Luminosity</dt>
                <dd className="text-gray-800">{fluid.fluidLuminosity}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Appearance</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Color (Hex)</dt>
                <dd className="text-gray-800 font-mono">{hex}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Color (Decimal)</dt>
                <dd className="text-gray-800">{color}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rarity</dt>
                <dd className="text-gray-800">{fluid.fluidRarity}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recipes</h2>
          <p className="text-gray-600">
            Recipe information will be displayed here in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FluidDetailPage;
