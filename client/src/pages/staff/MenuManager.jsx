import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import ImageUpload from '../../components/common/ImageUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

// ── Item Form Modal ────────────────────────────────────────────────────────
function ItemModal({ item, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    basePrice: item?.basePrice || '',
    categoryId: item?.categoryId || categories[0]?.id || '',
    imageUrl: item?.imageUrl || '',
    isAvailable: item?.isAvailable !== false
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) {
        const { data } = await api.patch(`/api/menu/items/${item.id}`, form);
        onSave(data.item, 'update');
        toast.success('Item updated');
      } else {
        const { data } = await api.post('/api/menu/items', form);
        onSave(data.item, 'create');
        toast.success('Item created');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{item ? 'Edit item' : 'New item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <ImageUpload
              currentImageUrl={form.imageUrl}
              onUpload={url => setForm(prev => ({ ...prev, imageUrl: url }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} resize="none"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input name="basePrice" type="number" step="0.01" min="0" value={form.basePrice} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} className="accent-orange-500" />
            Available for ordering
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Menu Manager Page ─────────────────────────────────────────────────────
export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null); // null = closed, undefined = new, object = editing
  const [newCatName, setNewCatName] = useState('');

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

  async function handleAddCategory(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/menu/categories', { name: newCatName });
      setCategories(prev => [...prev, data.category]);
      setNewCatName('');
      toast.success('Category added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category? Items must be reassigned first.')) return;
    try {
      await api.delete(`/api/menu/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete — category has items');
    }
  }

  function handleItemSave(savedItem, type) {
    if (type === 'create') {
      setItems(prev => [...prev, savedItem]);
    } else {
      setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
    }
  }

  async function handleDeleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/api/menu/items/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  }

  async function handleToggleAvailable(item) {
    try {
      const { data } = await api.patch(`/api/menu/items/${item.id}`, { isAvailable: !item.isAvailable });
      setItems(prev => prev.map(i => i.id === item.id ? data.item : i));
    } catch {
      toast.error('Failed to update availability');
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/staff" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
          <h1 className="text-2xl font-bold mt-1">Menu Manager</h1>
        </div>
        <button
          onClick={() => setEditItem(undefined)}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-600 transition"
        >
          + New Item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">Categories</h2>
          <div className="space-y-2 mb-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm font-medium">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="New category..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button type="submit" className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 transition">
              Add
            </button>
          </form>
        </div>

        {/* Items table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">{items.length} items</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-50">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🍔</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category?.name} · {formatCurrency(item.basePrice)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Availability toggle */}
                  <button
                    onClick={() => handleToggleAvailable(item)}
                    className={`text-xs px-2 py-1 rounded-full font-medium transition ${
                      item.isAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.isAvailable ? 'Live' : 'Off'}
                  </button>
                  <button onClick={() => setEditItem(item)} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item modal — editItem=undefined means "new", object means "editing" */}
      {editItem !== null && (
        <ItemModal
          item={editItem}
          categories={categories}
          onSave={handleItemSave}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
