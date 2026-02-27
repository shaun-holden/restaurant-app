import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../hooks/useCart';
import OptionGroupSelector from '../components/menu/OptionGroupSelector';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function MenuItemDetail() {
  const { id } = useParams(); // /items/:id → id = the menu item UUID
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChoices, setSelectedChoices] = useState([]); // array of OptionChoice objects
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get(`/api/menu/items/${id}`)
      .then(({ data }) => setItem(data.item))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Called when customer clicks a choice radio/checkbox
  function handleToggle(choice, isMultiSelect) {
    setSelectedChoices(prev => {
      if (isMultiSelect) {
        // Checkboxes: toggle this choice on/off
        const already = prev.find(c => c.id === choice.id);
        return already ? prev.filter(c => c.id !== choice.id) : [...prev, choice];
      } else {
        // Radio: replace any choice from the same group
        const filtered = prev.filter(c => c.optionGroupId !== choice.optionGroupId);
        return [...filtered, choice];
      }
    });
  }

  // Validate that all required groups have a selection before allowing add to cart
  function validate() {
    if (!item) return false;
    for (const group of item.optionGroups) {
      if (!group.required) continue;
      const hasSelection = selectedChoices.some(c => c.optionGroupId === group.id);
      if (!hasSelection) {
        toast.error(`Please make a selection for "${group.name}"`);
        return false;
      }
    }
    return true;
  }

  function handleAddToCart() {
    if (!validate()) return;

    // Add choices' optionGroupId so handleToggle can filter by group for radio buttons
    const choicesWithGroup = selectedChoices.map(c => ({
      ...c,
      optionGroupId: item.optionGroups.find(g =>
        g.choices.some(ch => ch.id === c.id)
      )?.id
    }));

    addItem(item, choicesWithGroup, quantity, notes);
    toast.success(`${item.name} added to cart`);
    navigate('/');
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (!item) return null;

  // Calculate running total: basePrice + all selected price modifiers, × quantity
  const unitPrice = parseFloat(item.basePrice) +
    selectedChoices.reduce((sum, c) => sum + parseFloat(c.priceModifier), 0);
  const totalPrice = unitPrice * quantity;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        ← Back
      </button>

      {/* Item image */}
      {item.imageUrl && (
        <div className="h-64 rounded-2xl overflow-hidden mb-6">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Item header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <span className="text-xl font-bold text-orange-500">{formatCurrency(item.basePrice)}</span>
        </div>
        {item.description && <p className="text-gray-500 text-sm">{item.description}</p>}
        <span className="text-xs text-gray-400">{item.category.name}</span>
      </div>

      {/* Option group selectors */}
      {item.optionGroups.length > 0 && (
        <div className="mb-6">
          {item.optionGroups.map(group => (
            <OptionGroupSelector
              key={group.id}
              group={group}
              selectedChoices={selectedChoices.filter(c =>
                group.choices.some(ch => ch.id === c.id)
              )}
              onToggle={(choice) => handleToggle(choice, group.multiSelect)}
            />
          ))}
        </div>
      )}

      {/* Special instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Special instructions</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. No onions, extra sauce..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
        />
      </div>

      {/* Quantity + Add to cart */}
      <div className="sticky bottom-4 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center justify-between gap-4">
        {/* Quantity controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-50"
          >
            −
          </button>
          <span className="text-lg font-semibold w-6 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-50"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition flex items-center justify-between px-4"
        >
          <span>Add to cart</span>
          <span>{formatCurrency(totalPrice)}</span>
        </button>
      </div>
    </div>
  );
}
