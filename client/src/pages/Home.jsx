import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import CategoryTabs from '../components/menu/CategoryTabs';
import SearchBar from '../components/menu/SearchBar';
import MenuGrid from '../components/menu/MenuGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch categories and items when the component mounts.
  // We use Promise.all to fetch them simultaneously instead of waiting
  // for one before starting the other — faster page load.
  useEffect(() => {
    Promise.all([
      api.get('/api/menu/categories'),
      api.get('/api/menu/items')
    ])
      .then(([catRes, itemRes]) => {
        setCategories(catRes.data.categories);
        setItems(itemRes.data.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter items client-side based on selected category and search term.
  // useMemo prevents this from recalculating on every render — only runs
  // when items, selectedCategoryId, or search changes.
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = !selectedCategoryId || item.category.id === selectedCategoryId;
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategoryId, search]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Menu</h1>
        <p className="text-gray-500">Fresh, made to order. Pickup or delivery.</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Category tabs */}
      <div className="mb-6">
        <CategoryTabs
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
      </p>

      {/* Menu grid */}
      <MenuGrid items={filteredItems} />
    </div>
  );
}
