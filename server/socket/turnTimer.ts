import { handleTimeout, TURN_TIME_LIMIT_MS, type GameState, type PlayerRole } from '@/engine/gameState';
import { toPlayerView, toSpectatorView } from '@/engine/gameView';
import type { RoomState } from './roomManager';
import type { TypedServer } from './index';

// Whoever is "on the clock" right now: the active turn during IN_PROGRESS, or SECOND during
// their one-shot final declaration window. Returns null once the game is FINISHED.
function playerOnTheClock(game: GameState): PlayerRole | null {
  if (game.phase === 'IN_PROGRESS') return game.currentTurn;
  if (game.phase === 'AWAITING_SECOND_CHANCE') return 'SECOND';
  return null;
}

function broadcastGameOver(io: TypedServer, room: RoomState, game: GameState): void {
  for (const connection of room.connections) {
    if (connection.socketId) {
      io.to(connection.socketId).emit('game:over', { view: toPlayerView(game, connection.role) });
    }
  }
  const spectatorView = toSpectatorView(game);
  for (const spectator of room.spectators) {
    io.to(spectator.socketId).emit('spectator:update', { view: spectatorView });
  }
}

// Clears any pending turn timeout and, if the game is still active, arms a new one for
// whoever is on the clock. Call this after every state transition that touches `room.game`
// (game start, question asked, declaration, forfeit, or a timeout firing) so the schedule
// always matches the current turn/phase.
export function scheduleTurnTimeout(io: TypedServer, room: RoomState): void {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = undefined;
  }

  const game = room.game;
  if (!game) return;
  const role = playerOnTheClock(game);
  if (!role) return;

  const delay = Math.max(0, game.turnStartedAt + TURN_TIME_LIMIT_MS - Date.now());
  room.turnTimer = setTimeout(() => {
    // Guard against a stale timer firing after the state already moved on (e.g. the player
    // acted right at the buzzer): room.game is replaced wholesale on every transition, so an
    // identity mismatch means this timer is no longer current.
    if (room.game !== game) return;
    let next: GameState;
    try {
      next = handleTimeout(game, role);
    } catch {
      return;
    }
    room.game = next;
    broadcastGameOver(io, room, next);
  }, delay);
}
