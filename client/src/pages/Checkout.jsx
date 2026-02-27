import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/api';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

// loadStripe is called OUTSIDE the component so it's only initialized once.
// It loads Stripe.js from Stripe's CDN — we never touch card data ourselves.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// The inner form — must be inside <Elements> to access useStripe/useElements
function CheckoutForm({ orderType, deliveryAddress, notes }) {
  const stripe = useStripe();       // Stripe.js instance
  const elements = useElements();   // CardElement reference
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js hasn't loaded yet

    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Ask our server to create a PaymentIntent
      // The server returns a clientSecret that authorizes the payment amount
      const { data } = await api.post('/api/payments/create-intent', {
        amount: subtotal,
        orderType,
        deliveryAddress,
        notes,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          selectedChoiceIds: item.selectedChoices.map(c => c.id)
        }))
      });

      // Step 2: Confirm the payment in the browser using Stripe's CardElement.
      // This is where the card number is sent — directly to Stripe, not our server.
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      // Step 3: Payment succeeded in the browser.
      // The server webhook will create the Order. We redirect to confirmation.
      clearCart();
      const paymentIntentId = result.paymentIntent.id;
      navigate(`/order-confirmation/${paymentIntentId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Stripe's secure card input iframe */}
      <div className="p-4 border border-gray-200 rounded-xl bg-white mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">Card details</label>
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9CA3AF' } }
            }
          }}
        />
      </div>

      {/* Test card hint */}
      <p className="text-xs text-gray-400 mb-4">
        Test card: <code className="bg-gray-100 px-1 rounded">4242 4242 4242 4242</code>, any future date, any CVC
      </p>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay ${formatCurrency(subtotal)}`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items, navigate]);

  if (items.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid gap-6">
        {/* Order type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">Order type</h2>
          <div className="grid grid-cols-2 gap-3">
            {['PICKUP', 'DELIVERY'].map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-3 rounded-xl border-2 font-medium transition ${
                  orderType === type
                    ? 'border-orange-400 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type === 'PICKUP' ? '🏃 Pickup' : '🚗 Delivery'}
              </button>
            ))}
          </div>

          {orderType === 'DELIVERY' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery address</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Allergy info, gate code, etc."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">Order summary</h2>
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.cartItemId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}× {item.name}
                  {item.selectedChoices.length > 0 && (
                    <span className="text-gray-400"> ({item.selectedChoices.map(c => c.label).join(', ')})</span>
                  )}
                </span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold mb-4">Payment</h2>
          {/* Elements wraps our form and provides Stripe context */}
          <Elements stripe={stripePromise}>
            <CheckoutForm
              orderType={orderType}
              deliveryAddress={deliveryAddress}
              notes={notes}
            />
          </Elements>
        </div>

        <Link to="/cart" className="text-center text-sm text-gray-500 hover:text-gray-700">← Back to cart</Link>
      </div>
    </div>
  );
}
