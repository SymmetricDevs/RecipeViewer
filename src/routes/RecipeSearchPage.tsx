import RecipeSearchPanel from '../components/search/RecipeSearchPanel';

function RecipeSearchPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Recipe Search</h1>
        <p className="text-gray-400">
          Search across all recipes using structured filters. Type a field name or select from the dropdown.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <RecipeSearchPanel autoFocus />
      </div>
    </div>
  );
}

export default RecipeSearchPage;
