import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';

export default function OrderConfirmation() {
  // The URL param here is actually the Stripe PaymentIntent ID (pi_xxx)
  // We poll the server briefly until the webhook has processed and created the order
  const { id: paymentIntentId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Poll for the order — webhook may take 1-3 seconds after client confirmation
    // We try up to 10 times (every second) before giving up
    const poll = async () => {
      try {
        const { data } = await api.get('/api/orders');
        const found = data.orders.find(o => o.stripePaymentId === paymentIntentId);
        if (found) {
          setOrder(found);
          setLoading(false);
          return true;
        }
      } catch {}
      return false;
    };

    let timer;
    const tryPoll = async (attempt) => {
      if (attempt >= 10) { setLoading(false); return; }
      const found = await poll();
      if (!found) {
        timer = setTimeout(() => tryPoll(attempt + 1), 1500);
        setAttempts(attempt + 1);
      }
    };
    tryPoll(0);
    return () => clearTimeout(timer);
  }, [paymentIntentId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Confirming your order{'.'.repeat((attempts % 3) + 1)}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h1 className="text-2xl font-bold mb-2">Payment received!</h1>
        <p className="text-gray-500 mb-6">Your order is being processed. Check your order history in a moment.</p>
        <Link to="/orders" className="bg-orange-500 text-white px-6 py-2.5 rounded-xl hover:bg-orange-600 transition">
          View orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">🎉</p>
      <h1 className="text-2xl font-bold mb-1">Order placed!</h1>
      <p className="text-gray-500 mb-6">
        {order.orderType === 'PICKUP' ? 'Your order will be ready for pickup soon.' : 'Your order is on its way!'}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Order ID</span>
          <span className="font-mono text-xs">{order.id.slice(0, 8)}…</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Type</span>
          <span className="font-medium">{order.orderType}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-500">Total</span>
          <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1">
          {order.items.map(item => (
            <div key={item.id} className="text-sm text-gray-600">
              {item.quantity}× {item.menuItem.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          to={`/orders/${order.id}`}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-xl hover:bg-orange-600 transition"
        >
          Track order
        </Link>
        <Link to="/" className="border border-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-50 transition text-gray-600">
          Back to menu
        </Link>
      </div>
    </div>
  );
}
