import { toSpectatorView } from '@/engine/gameView';
import { roomManager } from '../roomManager';
import { spectateSchema } from '../types/socketEvents';
import type { TypedServer, TypedSocket } from '../index';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function registerSpectatorHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('room:spectate', (payload) => {
    const parsed = spectateSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('room:error', { message: '入力内容を確認してください' });
      return;
    }

    let room: ReturnType<typeof roomManager.addSpectator>;
    try {
      room = roomManager.addSpectator(parsed.data.roomId.toUpperCase(), parsed.data.name, socket.id);
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '観戦に失敗しました') });
      return;
    }

    socket.data.roomId = room.roomId;
    socket.join(room.roomId);
    socket.emit('spectator:joined', { roomId: room.roomId, view: toSpectatorView(room.game!) });

    for (const connection of room.connections) {
      if (connection.socketId) {
        io.to(connection.socketId).emit('spectator:count-changed', { count: room.spectators.length });
      }
    }
  });

  socket.on('disconnect', () => {
    const room = roomManager.removeSpectatorBySocketId(socket.id);
    if (!room) return;
    for (const connection of room.connections) {
      if (connection.socketId) {
        io.to(connection.socketId).emit('spectator:count-changed', { count: room.spectators.length });
      }
    }
  });
}
