import { useEffect, useState } from 'react';
import { useMaterialStore } from '../stores/useMaterialStore';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const MATERIALS_PER_PAGE = 50;

function MaterialsPage() {
  const {
    materials,
    loading,
    error,
    filteredMaterials,
    searchQuery,
    fetchMaterials,
    setSearchQuery,
  } = useMaterialStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(filteredMaterials.length / MATERIALS_PER_PAGE);
  const startIndex = (page - 1) * MATERIALS_PER_PAGE;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + MATERIALS_PER_PAGE);

  useEffect(() => {
    if (materials.length === 0) {
      fetchMaterials();
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [localSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading materials...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Materials</h1>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search materials by name or formula..."
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Showing {startIndex + 1}-{Math.min(startIndex + MATERIALS_PER_PAGE, filteredMaterials.length).toLocaleString()} of {filteredMaterials.length.toLocaleString()} materials
            {filteredMaterials.length !== materials.length && ` (${materials.length.toLocaleString()} total)`}
          </p>
        </div>

        <div>
          {paginatedMaterials.map((mat, index) => {
            const hex = `#${mat.color.toString(16).padStart(6, '0')}`;
            return (
              <Link
                key={startIndex + index}
                to={`/materials/${encodeURIComponent(mat.unlocalizedName)}`}
                className="flex items-center p-4 border-b border-gray-700 hover:bg-gray-750 transition block"
              >
                <div
                  className="w-6 h-6 rounded mr-4 border border-gray-600 flex-shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-100">{mat.localizedName}</h3>
                  <p className="text-sm text-gray-400">
                    {mat.modId}
                    {mat.chemicalFormula && ` \u2022 ${mat.chemicalFormula}`}
                  </p>
                </div>
                <div className="text-sm text-gray-400 flex-shrink-0 ml-4 text-right">
                  {mat.items && mat.items.length > 0 && (
                    <div>{mat.items.length} item{mat.items.length !== 1 ? 's' : ''}</div>
                  )}
                  {mat.fluids && mat.fluids.length > 0 && (
                    <div>{mat.fluids.length} fluid{mat.fluids.length !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialsPage;
