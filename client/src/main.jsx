import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { SocketProvider } from './hooks/useSocket';

// Provider nesting order matters:
// AuthProvider is outermost because CartProvider and SocketProvider both
// depend on auth state (cart persists per user, socket connects after login).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
