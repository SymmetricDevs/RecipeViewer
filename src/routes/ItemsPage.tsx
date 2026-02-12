import { useEffect, useState } from 'react';
import { useItemStore } from '../stores/useItemStore';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

function ItemsPage() {
  const {
    items,
    loading,
    error,
    filteredItems,
    searchQuery,
    fetchItems,
    setSearchQuery,
  } = useItemStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (items.length === 0) {
      fetchItems();
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(debounce);
  }, [localSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading items...</div>
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
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Items</h1>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length).toLocaleString()} of {filteredItems.length.toLocaleString()} items
            {filteredItems.length !== items.length && ` (${items.length.toLocaleString()} total)`}
          </p>
        </div>

        <div>
          {paginatedItems.map((item, index) => {
            const mod = item.resource.split(':')[0];
            return (
              <Link
                key={startIndex + index}
                to={`/items/${encodeURIComponent(item.resource)}/${item.itemDamage ?? 0}`}
                className="flex items-center p-4 border-b border-gray-700 hover:bg-gray-750 transition block"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100">{item.displayName}</h3>
                  <p className="text-sm text-gray-400">
                    {mod} • {item.rarity}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  Stack: {item.maxStackSize}
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

export default ItemsPage;
