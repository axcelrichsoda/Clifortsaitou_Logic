import type { Server as HTTPServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './types/socketEvents';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';
import { registerSpectatorHandlers } from './handlers/spectatorHandlers';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function initSocketServer(httpServer: HTTPServer): TypedServer {
  const io: TypedServer = new Server(httpServer, {
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerSpectatorHandlers(io, socket);
  });

  return io;
}
