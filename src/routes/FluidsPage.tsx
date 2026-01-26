import { useEffect, useState } from 'react';
import { useFluidStore } from '../stores/useFluidStore';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

function FluidsPage() {
  const {
    fluids,
    loading,
    error,
    filteredFluids,
    searchQuery,
    fetchFluids,
    setSearchQuery,
  } = useFluidStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    if (fluids.length === 0) {
      fetchFluids();
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(debounce);
  }, [localSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading fluids...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Fluids</h1>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search fluids..."
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredFluids.length.toLocaleString()} of {fluids.length.toLocaleString()} fluids
          </p>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {filteredFluids.map((fluid, index) => {
            const color = fluid.fluidColor;
            const hex = `#${color.toString(16).padStart(6, '0')}`;
            return (
              <Link
                key={index}
                to={`/fluids/${fluids.indexOf(fluid)}`}
                className="flex items-center p-4 border-b hover:bg-gray-50 transition block"
              >
                <div
                  className="w-12 h-12 rounded mr-4 border border-gray-300"
                  style={{ backgroundColor: hex }}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {fluid.fluidLocalizedName}
                  </h3>
                  <p className="text-sm text-gray-500">{fluid.fluidName}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {fluid.fluidTemperature}K
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FluidsPage;
