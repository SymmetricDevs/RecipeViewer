import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useItemStore } from '../stores/useItemStore';
import { ArrowLeft } from 'lucide-react';

function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { items, fetchItems, getItemById } = useItemStore();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItem = async () => {
      if (items.length === 0) {
        await fetchItems();
      }
      if (id) {
        const foundItem = getItemById(parseInt(id));
        setItem(foundItem);
        setLoading(false);
      }
    };
    loadItem();
  }, [id, items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-600">Item not found</div>
      </div>
    );
  }

  const mod = item.resource.split(':')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/items"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Items
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{item.displayName}</h1>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Basic Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Mod</dt>
                <dd className="text-gray-800">{mod}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Resource</dt>
                <dd className="text-gray-800 font-mono text-sm">{item.resource}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rarity</dt>
                <dd className="text-gray-800">{item.rarity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Max Stack Size</dt>
                <dd className="text-gray-800">{item.maxStackSize}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Additional Properties</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Has Subtypes</dt>
                <dd className="text-gray-800">{item.hasSubtypes ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Max Damage</dt>
                <dd className="text-gray-800">{item.maxDamage}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Translation Key</dt>
                <dd className="text-gray-800 font-mono text-sm">{item.translationKey}</dd>
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

export default ItemDetailPage;
