import { askQuestion, declare, forfeitSecondChance, type GameState } from '@/engine/gameState';
import type { QuestionCardId } from '@/engine/questionCards';
import { toPlayerView, toSpectatorView } from '@/engine/gameView';
import { roomManager, type RoomConnection, type RoomState } from '../roomManager';
import { askQuestionSchema, declareSchema } from '../types/socketEvents';
import { scheduleTurnTimeout } from '../turnTimer';
import type { TypedServer, TypedSocket } from '../index';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function broadcastGameOver(io: TypedServer, room: RoomState, game: GameState): void {
  for (const connection of room.connections) {
    if (connection.socketId) {
      io.to(connection.socketId).emit('game:over', { view: toPlayerView(game, connection.role) });
    }
  }
}

function broadcastToSpectators(io: TypedServer, room: RoomState, game: GameState): void {
  const view = toSpectatorView(game);
  for (const spectator of room.spectators) {
    io.to(spectator.socketId).emit('spectator:update', { view });
  }
}

export function registerGameHandlers(io: TypedServer, socket: TypedSocket): void {
  // Never trust the payload for "who is asking" — always resolve the room/role from the
  // authenticated socket connection itself.
  function requireGameContext(): { room: RoomState; game: GameState; connection: RoomConnection } {
    const found = roomManager.findBySocketId(socket.id);
    if (!found || !found.room.game) throw new Error('対局が見つかりません');
    return { room: found.room, game: found.room.game, connection: found.connection };
  }

  socket.on('game:ask-question', (payload) => {
    const parsed = askQuestionSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('room:error', { message: '不正な質問です' });
      return;
    }

    let ctx: ReturnType<typeof requireGameContext>;
    try {
      ctx = requireGameContext();
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '対局が見つかりません') });
      return;
    }

    const { room, game, connection } = ctx;
    let next: GameState;
    try {
      next = askQuestion(game, connection.role, parsed.data.cardId as QuestionCardId, parsed.data.subChoice);
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '質問できませんでした') });
      return;
    }
    room.game = next;
    scheduleTurnTimeout(io, room);

    for (const conn of room.connections) {
      if (conn.socketId) {
        io.to(conn.socketId).emit('game:question-asked', { view: toPlayerView(next, conn.role) });
      }
    }
    broadcastToSpectators(io, room, next);
    if (next.phase === 'FINISHED') broadcastGameOver(io, room, next);
  });

  socket.on('game:declare', (payload) => {
    const parsed = declareSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('room:error', { message: '不正な宣言です' });
      return;
    }

    let ctx: ReturnType<typeof requireGameContext>;
    try {
      ctx = requireGameContext();
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '対局が見つかりません') });
      return;
    }

    const { room, game, connection } = ctx;
    const wasInProgress = game.phase === 'IN_PROGRESS';
    let next: GameState;
    try {
      next = declare(game, connection.role, parsed.data.guess);
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '宣言できませんでした') });
      return;
    }
    room.game = next;
    scheduleTurnTimeout(io, room);

    // An incorrect declaration during normal play just passes the turn (phase stays IN_PROGRESS);
    // any other transition (AWAITING_SECOND_CHANCE / FINISHED) means this declaration was correct.
    const correct = !(wasInProgress && next.phase === 'IN_PROGRESS');

    for (const conn of room.connections) {
      if (conn.socketId) {
        io.to(conn.socketId).emit('game:declare-result', { correct, view: toPlayerView(next, conn.role) });
      }
    }
    if (next.phase === 'AWAITING_SECOND_CHANCE') {
      for (const conn of room.connections) {
        if (conn.socketId) {
          io.to(conn.socketId).emit('game:second-chance-opportunity', { view: toPlayerView(next, conn.role) });
        }
      }
    }
    broadcastToSpectators(io, room, next);
    if (next.phase === 'FINISHED') broadcastGameOver(io, room, next);
  });

  socket.on('game:forfeit-second-chance', () => {
    let ctx: ReturnType<typeof requireGameContext>;
    try {
      ctx = requireGameContext();
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '対局が見つかりません') });
      return;
    }

    const { room, game, connection } = ctx;
    let next: GameState;
    try {
      next = forfeitSecondChance(game, connection.role);
    } catch (err) {
      socket.emit('room:error', { message: errorMessage(err, '放棄できませんでした') });
      return;
    }
    room.game = next;
    scheduleTurnTimeout(io, room);
    broadcastToSpectators(io, room, next);
    broadcastGameOver(io, room, next);
  });
}
