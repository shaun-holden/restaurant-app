import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import OrderCard from '../../components/order/OrderCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useSocket();

  // Load active orders on mount
  useEffect(() => {
    api.get('/api/orders/active')
      .then(({ data }) => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Real-time Socket.IO subscriptions
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    // join:staff is emitted by useSocket on connect if role is STAFF/ADMIN.
    // We call it again here in case the socket was already connected before this
    // component mounted (e.g. page refresh).
    socket.emit('join:staff');

    // New order just placed — prepend it to the list
    function handleNewOrder(order) {
      setOrders(prev => [order, ...prev]);
    }

    // Status changed — update the matching card in state
    function handleStatusUpdate({ orderId, status }) {
      setOrders(prev => {
        // Remove DELIVERED/CANCELLED orders from the active list
        if (status === 'DELIVERED' || status === 'CANCELLED') {
          return prev.filter(o => o.id !== orderId);
        }
        return prev.map(o => o.id === orderId ? { ...o, status } : o);
      });
    }

    socket.on('order:new', handleNewOrder);
    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socketRef]);

  // Called from OrderCard after a successful status API call
  // (in addition to the socket update, which handles the real-time case)
  function handleStatusChange(orderId, status) {
    setOrders(prev => {
      if (status === 'DELIVERED' || status === 'CANCELLED') {
        return prev.filter(o => o.id !== orderId);
      }
      return prev.map(o => o.id === orderId ? { ...o, status } : o);
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-600">Live</span>
            </span>
          </p>
        </div>
        <Link
          to="/staff/menu"
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition"
        >
          Manage Menu
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : orders.length === 0 ? (
        <EmptyState title="No active orders" description="New orders will appear here in real time." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
