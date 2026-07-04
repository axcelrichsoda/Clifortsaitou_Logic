import { z } from 'zod';
import type { Color } from '@/engine/types';
import type { GameStateView, SpectatorView } from '@/engine/gameView';
import type { PlayerRole } from '@/engine/gameState';

export const roomCreateSchema = z.object({
  name: z.string().trim().min(1).max(20),
});

export const roomJoinSchema = z.object({
  roomId: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(20),
});

export const roomRejoinSchema = z.object({
  roomId: z.string().trim().min(1).max(20),
  playerToken: z.string().trim().min(1),
});

export const askQuestionSchema = z.object({
  cardId: z.number().int().min(1).max(21),
  subChoice: z.number().int().optional(),
});

const tileGuessSchema = z.object({
  number: z.number().int().min(0).max(9),
  color: z.enum(['RED', 'BLUE', 'YELLOW']),
});

export const declareSchema = z.object({
  guess: z.array(tileGuessSchema).length(5),
});

export const spectateSchema = z.object({
  roomId: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(20),
});

export interface LobbyView {
  phase: 'LOBBY_WAITING';
  roomId: string;
  yourName: string;
  opponentJoined: boolean;
}

export type RoomOrGameView = LobbyView | GameStateView;

export interface ServerToClientEvents {
  'room:created': (payload: { roomId: string; playerToken: string; view: LobbyView }) => void;
  'room:joined': (payload: { roomId: string; playerToken: string; view: RoomOrGameView }) => void;
  'room:error': (payload: { message: string }) => void;
  'game:started': (payload: { view: GameStateView }) => void;
  'game:question-asked': (payload: { view: GameStateView }) => void;
  'game:declare-result': (payload: { correct: boolean; view: GameStateView }) => void;
  'game:second-chance-opportunity': (payload: { view: GameStateView }) => void;
  'game:over': (payload: { view: GameStateView }) => void;
  'player:disconnected': (payload: { role: PlayerRole }) => void;
  'player:reconnected': (payload: { role: PlayerRole; view: RoomOrGameView }) => void;
  'spectator:joined': (payload: { roomId: string; view: SpectatorView }) => void;
  'spectator:update': (payload: { view: SpectatorView }) => void;
  'spectator:count-changed': (payload: { count: number }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: { name: string }) => void;
  'room:join': (payload: { roomId: string; name: string }) => void;
  'room:rejoin': (payload: { roomId: string; playerToken: string }) => void;
  'room:spectate': (payload: { roomId: string; name: string }) => void;
  'game:ask-question': (payload: { cardId: number; subChoice?: number }) => void;
  'game:declare': (payload: { guess: { number: number; color: Color }[] }) => void;
  'game:forfeit-second-chance': () => void;
}

// Single-process deployment, no inter-server communication needed.
export type InterServerEvents = Record<string, never>;

export interface SocketData {
  roomId?: string;
  playerToken?: string;
}
