import { toPlayerView, toSpectatorView } from '@/engine/gameView';
import { roomManager } from '../roomManager';
import { roomCreateSchema, roomJoinSchema, roomRejoinSchema, type RoomOrGameView } from '../types/socketEvents';
import { scheduleTurnTimeout } from '../turnTimer';
import type { TypedServer, TypedSocket } from '../index';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('room:create', (payload) => {
    const parsed = roomCreateSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('room:error', { message: '入力内容を確認してください' });
      return;
    }

    const { room, playerToken } = roomManager.createRoom(parsed.data.name, socket.id);
    socket.data.roomId = room.roomId;
    socket.data.playerToken = playerToken;
    socket.join(room.roomId);

    socket.emit('room:created', {
      roomId: room.roomId,
      playerToken,
      view: { phase: 'LOBBY_WAITING', roomId: room.roomId, yourName: parsed.data.name, opponentJoined: false },
    });
  });

  socket.on('room:join', (payload) => {
    const parsed = roomJoinSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('room:error', { message: '入力内容を確認してください' });
      return;
    }

    let joined: ReturnType<typeof roomManager.joinRoom>;
    try {
      joined = roomManager.joinRoom(parsed.data.roomId.toUpperCase(), parsed.data.name, socket.id);
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '参加に失敗しました') });
      return;
    }

    const { room, playerToken, role } = joined;
    const game = room.game!;
    socket.data.roomId = room.roomId;
    socket.data.playerToken = playerToken;
    socket.join(room.roomId);
    scheduleTurnTimeout(io, room);

    socket.emit('room:joined', { roomId: room.roomId, playerToken, view: toPlayerView(game, role) });

    for (const connection of room.connections) {
      if (connection.socketId) {
        io.to(connection.socketId).emit('game:started', { view: toPlayerView(game, connection.role) });
      }
    }
  });

  socket.on('room:rejoin', (payload) => {
    const parsed = roomRejoinSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('room:error', { message: '入力内容を確認してください' });
      return;
    }

    let found: ReturnType<typeof roomManager.findByToken>;
    try {
      found = roomManager.findByToken(parsed.data.roomId.toUpperCase(), parsed.data.playerToken);
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '再接続に失敗しました') });
      return;
    }

    const { room, connection } = found;
    roomManager.markConnected(room, connection, socket.id);
    socket.data.roomId = room.roomId;
    socket.data.playerToken = connection.playerToken;
    socket.join(room.roomId);

    const view: RoomOrGameView = room.game
      ? toPlayerView(room.game, connection.role)
      : {
          phase: 'LOBBY_WAITING',
          roomId: room.roomId,
          yourName: connection.name,
          opponentJoined: room.connections.length >= 2,
        };

    socket.emit('room:joined', { roomId: room.roomId, playerToken: connection.playerToken, view });

    const opponent = roomManager.otherConnection(room, connection.role);
    if (room.game) {
      if (opponent?.socketId) {
        io.to(opponent.socketId).emit('player:reconnected', {
          role: connection.role,
          view: toPlayerView(room.game, opponent.role),
        });
      }
      const spectatorView = toSpectatorView(room.game);
      for (const spectator of room.spectators) {
        io.to(spectator.socketId).emit('spectator:update', { view: spectatorView });
      }
    }
  });

  socket.on('disconnect', () => {
    const found = roomManager.findBySocketId(socket.id);
    if (!found) return;
    const { room, connection } = found;
    roomManager.markDisconnected(room, connection);
    const opponent = roomManager.otherConnection(room, connection.role);
    if (opponent?.socketId) {
      io.to(opponent.socketId).emit('player:disconnected', { role: connection.role });
    }
    if (room.game) {
      const spectatorView = toSpectatorView(room.game);
      for (const spectator of room.spectators) {
        io.to(spectator.socketId).emit('spectator:update', { view: spectatorView });
      }
    }
  });
}
