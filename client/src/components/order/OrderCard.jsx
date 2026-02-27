import api from '../../utils/api';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

// Maps current status → next action a staff member can take
const NEXT_ACTION = {
  PENDING:   { label: 'Confirm Order', next: 'CONFIRMED', color: 'bg-blue-500 hover:bg-blue-600' },
  CONFIRMED: { label: 'Start Preparing', next: 'PREPARING', color: 'bg-purple-500 hover:bg-purple-600' },
  PREPARING: { label: 'Mark Ready', next: 'READY', color: 'bg-green-500 hover:bg-green-600' },
  READY:     { label: 'Mark Delivered', next: 'DELIVERED', color: 'bg-gray-500 hover:bg-gray-600' }
};

// Formats elapsed time: "2 min ago", "1 hr ago"
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

export default function OrderCard({ order, onStatusChange }) {
  const action = NEXT_ACTION[order.status];

  async function handleAdvance() {
    try {
      await api.patch(`/api/orders/${order.id}/status`, { status: action.next });
      onStatusChange(order.id, action.next);
      toast.success(`Order marked as ${action.next}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.patch(`/api/orders/${order.id}/status`, { status: 'CANCELLED' });
      onStatusChange(order.id, 'CANCELLED');
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</p>
          <p className="font-semibold text-gray-900">{order.customer?.name}</p>
          <p className="text-xs text-gray-500">{order.orderType} · {timeAgo(order.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1">
        {order.items.map(item => (
          <div key={item.id} className="text-sm text-gray-700">
            <span className="font-medium">{item.quantity}×</span> {item.menuItem.name}
            {item.choices.length > 0 && (
              <span className="text-gray-400 text-xs"> — {item.choices.map(c => c.optionChoice.label).join(', ')}</span>
            )}
          </div>
        ))}
      </div>

      {order.deliveryAddress && (
        <p className="text-xs text-gray-500 mb-3">📍 {order.deliveryAddress}</p>
      )}
      {order.notes && (
        <p className="text-xs text-gray-500 italic mb-3">"{order.notes}"</p>
      )}

      {/* Actions */}
      {action && (
        <div className="flex gap-2">
          <button
            onClick={handleAdvance}
            className={`flex-1 ${action.color} text-white py-2 rounded-xl text-sm font-semibold transition`}
          >
            {action.label}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {order.status === 'DELIVERED' && (
        <p className="text-center text-xs text-green-600 font-medium py-1">✓ Completed</p>
      )}
    </div>
  );
}
