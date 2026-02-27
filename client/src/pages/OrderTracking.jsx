import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';

// The steps in order — used to render the progress timeline
const STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
const STEP_LABELS = {
  PENDING: 'Order received',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered'
};
const STEP_ICONS = {
  PENDING: '📋',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  READY: '🍔',
  DELIVERED: '🎉'
};

export default function OrderTracking() {
  const { id } = useParams();
  const socketRef = useSocket(); // ref to socket instance
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial order state from the API
  useEffect(() => {
    api.get(`/api/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Subscribe to real-time status updates via Socket.IO
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    // Tell the server "I want updates for this order"
    socket.emit('join:order', { orderId: id });

    // When the server emits 'order:status_update' for this order, update local state
    function handleStatusUpdate({ orderId, status }) {
      if (orderId === id) {
        setOrder(prev => prev ? { ...prev, status } : prev);
      }
    }

    socket.on('order:status_update', handleStatusUpdate);

    // Cleanup: remove listener when component unmounts
    return () => {
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [id, socketRef]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-8"><p>Order not found.</p></div>;

  const currentIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600 text-sm">← Orders</Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">
        {isCancelled ? 'Order Cancelled' : 'Tracking your order'}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {order.orderType === 'PICKUP' ? 'Pickup order' : `Delivery to: ${order.deliveryAddress}`}
        {' · '}Order #{order.id.slice(0, 8)}
      </p>

      {/* Real-time status timeline */}
      {!isCancelled && (
        <div className="relative mb-8">
          {STEPS.map((step, index) => {
            const isDone = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step} className="flex items-start gap-4 mb-6">
                {/* Step circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border-2 transition-all ${
                  isDone
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-white border-gray-200'
                }`}>
                  {isDone ? STEP_ICONS[step] : <span className="w-2 h-2 bg-gray-300 rounded-full" />}
                </div>

                {/* Step info */}
                <div className={`pt-1.5 ${isDone ? 'opacity-100' : 'opacity-40'}`}>
                  <p className={`font-semibold ${isCurrent ? 'text-orange-500' : 'text-gray-700'}`}>
                    {STEP_LABELS[step]}
                    {isCurrent && <span className="ml-2 text-xs font-normal text-orange-400 animate-pulse">● Live</span>}
                  </p>
                  {step === 'READY' && order.orderType === 'PICKUP' && isDone && (
                    <p className="text-xs text-gray-500 mt-0.5">Come pick up your order!</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Vertical connector line */}
          <div className="absolute left-5 top-10 bottom-6 w-px bg-gray-200 -z-10" />
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-600 font-medium">This order was cancelled.</p>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold mb-4">Order items</h2>
        <div className="space-y-2 mb-4">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}× {item.menuItem.name}
                {item.choices.length > 0 && (
                  <span className="text-gray-400"> ({item.choices.map(c => c.optionChoice.label).join(', ')})</span>
                )}
              </span>
              <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
