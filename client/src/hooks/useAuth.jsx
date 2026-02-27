import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Step 1: Create the Context object.
// This is just an empty container — it doesn't hold any data yet.
const AuthContext = createContext(null);

// Step 2: Create the Provider component.
// This wraps the app and makes auth state available to any child component.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check if user is already logged in

  // On mount, check if there's a JWT in localStorage from a previous session.
  // If so, fetch the user's profile and restore their session.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/auth/me')
        .then(({ data }) => setUser(data.user))
        .catch(() => localStorage.removeItem('token')) // token expired or invalid
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Called after a successful login or register API call
  function login(userData, token) {
    localStorage.setItem('token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Step 3: Custom hook so any component can access auth state cleanly.
// Usage: const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
