import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt.js';
import { JwtPayload } from '../types/index.js';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export function initializeSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    const { restaurantId, branchId } = socket.user;

    const room = branchId ? `restaurant:${restaurantId}:branch:${branchId}` : `restaurant:${restaurantId}`;
    socket.join(room);

    console.log(`User ${socket.user.userId} connected to ${room}`);

    socket.on('order:new', (data) => {
      socket.to(room).emit('order:new', {
        ...data,
        restaurantId,
        branchId,
      });
    });

    socket.on('order:update', (data) => {
      socket.to(room).emit('order:update', {
        ...data,
        restaurantId,
        branchId,
      });
    });

    socket.on('order:status', (data) => {
      socket.to(room).emit('order:status', {
        ...data,
        restaurantId,
        branchId,
      });
    });

    socket.on('kds:bump', (data) => {
      socket.to(room).emit('kds:bump', {
        ...data,
        restaurantId,
        branchId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.userId} disconnected`);
    });
  });

  return io;
}

export function emitOrderEvent(
  io: SocketServer,
  restaurantId: string,
  branchId: string,
  event: string,
  data: unknown
) {
  const room = `restaurant:${restaurantId}:branch:${branchId}`;
  io.to(room).emit(event, {
    ...data as object,
    restaurantId,
    branchId,
  });
}
