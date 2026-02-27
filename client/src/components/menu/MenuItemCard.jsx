import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';

// A card representing one menu item in the grid.
// - Items WITH option groups → navigate to detail page so the customer can customize
// - Items WITHOUT option groups → add directly to cart (simple items like "Water")
export default function MenuItemCard({ item }) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  // _count.optionGroups comes from the list endpoint; optionGroups?.length from the detail endpoint
  const hasOptions = (item._count?.optionGroups ?? item.optionGroups?.length ?? 0) > 0;

  function handleAdd(e) {
    e.preventDefault();
    if (hasOptions) {
      navigate(`/items/${item.id}`);
    } else {
      addItem(item, [], 1);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
      {/* Item image */}
      <div className="h-44 bg-gray-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🍔
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">{formatCurrency(item.basePrice)}</span>
          <button
            onClick={handleAdd}
            disabled={!item.isAvailable}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              item.isAvailable
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {item.isAvailable ? (hasOptions ? 'Customize' : '+ Add') : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
