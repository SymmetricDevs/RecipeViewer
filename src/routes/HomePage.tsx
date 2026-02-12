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
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Supersymmetry Recipe Viewer
        </h1>
        <p className="text-xl text-gray-400">
          Browse items, fluids, and recipes from Supersymmetry
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/items"
            className="bg-gray-800 rounded-lg shadow-md p-6 hover:bg-gray-750 hover:border-cyan-500 border border-gray-700 transition"
          >
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-cyan-400 mr-3" />
              <h2 className="text-2xl font-bold text-gray-100">Items</h2>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {stats.items.toLocaleString()}
            </p>
            <p className="text-gray-400 mt-2">Browse all items</p>
          </Link>

          <Link
            to="/fluids"
            className="bg-gray-800 rounded-lg shadow-md p-6 hover:bg-gray-750 hover:border-cyan-500 border border-gray-700 transition"
          >
            <div className="flex items-center mb-4">
              <Droplet className="h-8 w-8 text-cyan-400 mr-3" />
              <h2 className="text-2xl font-bold text-gray-100">Fluids</h2>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {stats.fluids.toLocaleString()}
            </p>
            <p className="text-gray-400 mt-2">Browse all fluids</p>
          </Link>

          <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <Wrench className="h-8 w-8 text-cyan-400 mr-3" />
              <h2 className="text-2xl font-bold text-gray-100">Recipes</h2>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {stats.recipemaps.toLocaleString()}
            </p>
            <p className="text-gray-400 mt-2">Recipe maps</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">About</h2>
        <p className="text-gray-400 mb-4">
          This reference contains (almost) every single recipe in the Supersymmetry modpack (as of v0.1.16-rc2), along with all of its items and fluids.
        </p>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
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
