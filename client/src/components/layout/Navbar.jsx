import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold text-orange-500 hover:text-orange-600">
          BurgerHouse
        </Link>

        {/* Right side nav items */}
        <div className="flex items-center gap-4">
          {/* Cart icon — shows item count badge */}
          <Link to="/cart" className="relative p-2 hover:text-orange-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">Hi, {user.name.split(' ')[0]}</span>

              {/* Staff/Admin get a link to their dashboard */}
              {(user.role === 'STAFF' || user.role === 'ADMIN') && (
                <Link to="/staff" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                  Dashboard
                </Link>
              )}

              <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                Orders
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
