import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useItemStore } from '../stores/useItemStore';
import { useRecipeStore } from '../stores/useRecipeStore';
import { ArrowLeft } from 'lucide-react';
import { RecipeList } from '../components/recipes';
import type { RecipesForItem } from '../types/recipeIndex';

function ItemDetailPage() {
  const { resource, damage } = useParams<{ resource: string; damage: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'input' ? 'input' : 'output';
  const { items, fetchItems, getItemByResourceAndDamage } = useItemStore();
  const { getRecipesForItem, indexLoading, indexError } = useRecipeStore();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<RecipesForItem | null>(null);
  const [recipesLoading, setRecipesLoading] = useState(false);

  useEffect(() => {
    const loadItem = async () => {
      if (items.length === 0) {
        await fetchItems();
      }
      if (resource && damage) {
        const decodedResource = decodeURIComponent(resource);
        const foundItem = getItemByResourceAndDamage(decodedResource, parseInt(damage));
        setItem(foundItem);
        setLoading(false);
      }
    };
    loadItem();
  }, [resource, damage, items]);

  useEffect(() => {
    const loadRecipes = async () => {
      if (item) {
        setRecipesLoading(true);
        try {
          const itemRecipes = await getRecipesForItem(item.resource, item.itemDamage ?? 0);
          setRecipes(itemRecipes);
        } catch (err) {
          console.error('Failed to load recipes:', err);
        } finally {
          setRecipesLoading(false);
        }
      }
    };
    loadRecipes();
  }, [item]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-400">Item not found</div>
      </div>
    );
  }

  const mod = item.resource.split(':')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/items"
        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Items
      </Link>

      <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">{item.displayName}</h1>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Basic Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Mod</dt>
                <dd className="text-gray-100">{mod}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Resource</dt>
                <dd className="text-gray-100 font-mono text-sm">{item.resource}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Rarity</dt>
                <dd className="text-gray-100">{item.rarity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Max Stack Size</dt>
                <dd className="text-gray-100">{item.maxStackSize}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Additional Properties</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-400">Has Subtypes</dt>
                <dd className="text-gray-100">{item.hasSubtypes ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Max Damage</dt>
                <dd className="text-gray-100">{item.maxDamage}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Translation Key</dt>
                <dd className="text-gray-100 font-mono text-sm">{item.translationKey}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Recipes</h2>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <RecipeList
              asInput={recipes?.asInput || []}
              asOutput={recipes?.asOutput || []}
              loading={recipesLoading || indexLoading}
              error={indexError}
              initialTab={initialTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailPage;
