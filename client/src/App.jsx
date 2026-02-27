import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';

import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MenuItemDetail from './pages/MenuItemDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import StaffDashboard from './pages/staff/StaffDashboard';
import MenuManager from './pages/staff/MenuManager';

// ── Protected Route ────────────────────────────────────────────────────────
// Wraps routes that require auth. Shows spinner while auth state loads,
// redirects to /login if not logged in, redirects to / if wrong role.
function ProtectedRoute({ children, requiredRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* react-hot-toast notification container */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Navbar />

      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items/:id" element={<MenuItemDetail />} />
          <Route path="/cart" element={<Cart />} />

          {/* Customer protected */}
          <Route path="/checkout" element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/order-confirmation/:id" element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <OrderConfirmation />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <OrderTracking />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute requiredRoles={['CUSTOMER']}>
              <OrderHistory />
            </ProtectedRoute>
          } />

          {/* Staff + Admin protected */}
          <Route path="/staff" element={
            <ProtectedRoute requiredRoles={['STAFF', 'ADMIN']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/menu" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <MenuManager />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
