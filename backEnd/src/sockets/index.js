// sockets/index.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { initRoomSockets } from './room.socket.js';

export function initSockets(server, { corsOrigin = '*' } = {}) {
  const io = new Server(server, {
    cors: { origin: corsOrigin },
    // pingInterval / pingTimeout etc si besoin
  });

  // Middleware de vérification du token socket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Socket token required'));

      const payload = jwt.verify(token, process.env.SOCKET_JWT_SECRET);
      if (!payload?.email) return next(new Error('Invalid socket token payload'));

      socket.userEmail = payload.email;
      return next();

    } catch (err) {
      console.error('Socket auth error', err.message);
      return next(new Error('Socket authentication failed'));
    }
  });

  // Delegate to room-specific handlers
  initRoomSockets(io);

  return io;
}
