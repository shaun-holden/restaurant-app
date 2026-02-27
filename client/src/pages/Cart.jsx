import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';
import EmptyState from '../components/common/EmptyState';

function CartItemRow({ item }) {
  const { updateQuantity, removeItem } = useCart();
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🍔</div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        {item.selectedChoices.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">{item.selectedChoices.map(c => c.label).join(', ')}</p>
        )}
        {item.notes && <p className="text-xs text-gray-400 italic mt-0.5">{item.notes}</p>}
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
            className="w-7 h-7 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-50">−</button>
          <span className="text-sm font-medium">{item.quantity}</span>
          <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
            className="w-7 h-7 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-50">+</button>
          <button onClick={() => removeItem(item.cartItemId)}
            className="text-xs text-red-400 hover:text-red-600 ml-2">Remove</button>
        </div>
      </div>
      <div className="text-right">
        <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
        {item.quantity > 1 && (
          <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</p>
        )}
      </div>
    </div>
  );
}

export default function Cart() {
  const { items, subtotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Add some items from the menu to get started."
          action={<Link to="/" className="inline-block mt-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl hover:bg-orange-600 transition">Browse menu</Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600">Clear all</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 mb-6">
        {items.map(item => <CartItemRow key={item.cartItemId} item={item} />)}
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm mb-4 text-gray-400">
          <span>Delivery fee</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <Link
          to="/checkout"
          className="mt-4 block w-full text-center bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          Proceed to checkout
        </Link>
        <Link to="/" className="mt-2 block w-full text-center text-sm text-gray-500 hover:text-gray-700">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
