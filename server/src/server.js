require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

// ── HTTP SERVER ────────────────────────────────────────────────────────────
// We wrap Express in Node's built-in http.Server.
// This is required because Socket.IO needs to attach to the HTTP server
// (not just the Express app) so it can intercept the WebSocket upgrade handshake.
const httpServer = http.createServer(app);

// ── SOCKET.IO ─────────────────────────────────────────────────────────────
// Attach Socket.IO to the same HTTP server.
// In Phase 6 we'll add event handlers here. For now we just initialize it.
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make `io` accessible in controllers via req.app.get('io')
// This avoids circular imports — controllers can emit events without
// needing to import the socket server directly.
app.set('io', io);

// Socket event handlers (join:order, join:staff, disconnect)
require('./socket/socketHandler')(io);

// ── START ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
