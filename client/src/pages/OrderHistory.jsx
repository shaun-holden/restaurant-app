import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/order/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Your order history will appear here."
          action={<Link to="/" className="inline-block mt-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl hover:bg-orange-600 transition">Browse menu</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.items.map(i => i.menuItem.name).slice(0, 2).join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    {' · '}{order.orderType}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
              <p className="text-xs text-orange-500 font-medium">View details →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
