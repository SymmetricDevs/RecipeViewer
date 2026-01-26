import { useEffect, useState } from 'react';
import { useItemStore } from '../stores/useItemStore';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

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

  useEffect(() => {
    if (items.length === 0) {
      fetchItems();
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
        <div className="text-xl text-gray-600">Loading items...</div>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Items</h1>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredItems.length.toLocaleString()} of {items.length.toLocaleString()} items
          </p>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {filteredItems.map((item, index) => {
            const mod = item.resource.split(':')[0];
            return (
              <Link
                key={index}
                to={`/items/${items.indexOf(item)}`}
                className="flex items-center p-4 border-b hover:bg-gray-50 transition block"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{item.displayName}</h3>
                  <p className="text-sm text-gray-500">
                    {mod} • {item.rarity}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Stack: {item.maxStackSize}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;
