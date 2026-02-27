// This module sets up all Socket.IO event listeners.
// It's called once in server.js with the `io` instance.
//
// KEY CONCEPT: Socket.IO "rooms"
// A room is just a named channel. When a socket joins a room,
// it receives any messages emitted to that room.
// - Customer joins room "order:{orderId}" → gets status updates for their order
// - Staff joins room "staff-room" → gets all new orders + all status updates

module.exports = function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Customer: subscribe to updates for a specific order
    socket.on('join:order', ({ orderId }) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order room: order:${orderId}`);
    });

    // Staff/Admin: subscribe to all incoming orders and status changes
    socket.on('join:staff', () => {
      socket.join('staff-room');
      console.log(`Socket ${socket.id} joined staff-room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
