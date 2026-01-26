import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadMetadata } from '../services/dataLoader';
import { Package, Droplet, Wrench } from 'lucide-react';

function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetadata()
      .then(metadata => {
        setStats(metadata.stats);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading metadata:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Supersymmetry Recipe Viewer
        </h1>
        <p className="text-xl text-gray-600">
          Browse items, fluids, and recipes from the Susy modpack
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/items"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Items</h2>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {stats.items.toLocaleString()}
            </p>
            <p className="text-gray-600 mt-2">Browse all items</p>
          </Link>

          <Link
            to="/fluids"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center mb-4">
              <Droplet className="h-8 w-8 text-green-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Fluids</h2>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.fluids.toLocaleString()}
            </p>
            <p className="text-gray-600 mt-2">Browse all fluids</p>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Wrench className="h-8 w-8 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Recipes</h2>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {stats.recipemaps.toLocaleString()}
            </p>
            <p className="text-gray-600 mt-2">Recipe maps</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
        <p className="text-gray-600 mb-4">
          This recipe viewer helps you explore the vast content of the Supersymmetry
          modpack. Browse through thousands of items, fluids, and recipes without
          having to open the game.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>{stats?.items.toLocaleString()} unique items</li>
          <li>{stats?.fluids.toLocaleString()} fluids</li>
          <li>{stats?.crafting.toLocaleString()} crafting recipes</li>
          <li>{stats?.smelting.toLocaleString()} smelting recipes</li>
          <li>{stats?.recipemaps.toLocaleString()} GregTech recipe maps</li>
          <li>{stats?.machines.toLocaleString()} machines</li>
        </ul>
      </div>
    </div>
  );
}

export default HomePage;
