import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

// Socket.IO connects once when the user is logged in and disconnects on logout.
// We use a ref (not state) to hold the socket instance because re-renders
// shouldn't create a new socket — we always want exactly one connection.

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      // In production VITE_API_URL is not set, so fall back to the current origin
      socketRef.current = io(import.meta.env.VITE_API_URL || window.location.origin, {
        auth: { token: localStorage.getItem('token') }
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);

        // If user is staff/admin, join the staff room for live order updates
        if (user.role === 'STAFF' || user.role === 'ADMIN') {
          socketRef.current.emit('join:staff');
        }
      });
    }

    // Cleanup: disconnect when user logs out
    return () => {
      if (!user && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

// Returns the socket ref so components can call socket.emit() and socket.on()
export function useSocket() {
  return useContext(SocketContext);
}
