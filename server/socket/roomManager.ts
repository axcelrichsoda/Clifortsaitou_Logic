import { customAlphabet, nanoid } from 'nanoid';
import { createGame } from '@/engine/gameState';
import type { GameState, PlayerRole } from '@/engine/gameState';

// Excludes visually ambiguous characters (0/O, 1/I) so room codes are easy to read aloud/type.
const generateRoomId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export interface RoomConnection {
  playerToken: string;
  socketId: string | null;
  name: string;
  role: PlayerRole;
  connected: boolean;
}

export interface SpectatorConnection {
  socketId: string;
  name: string;
}

export interface RoomState {
  roomId: string;
  connections: RoomConnection[]; // length 1 (waiting) or 2 (in game)
  spectators: SpectatorConnection[];
  game?: GameState;
  disconnectTimer?: ReturnType<typeof setTimeout>;
  turnTimer?: ReturnType<typeof setTimeout>;
}

const DISCONNECT_GRACE_MS = 5 * 60 * 1000;

class RoomManager {
  private rooms = new Map<string, RoomState>();

  createRoom(name: string, socketId: string): { room: RoomState; playerToken: string } {
    let roomId = generateRoomId();
    while (this.rooms.has(roomId)) roomId = generateRoomId();
    const playerToken = nanoid();
    const room: RoomState = {
      roomId,
      connections: [{ playerToken, socketId, name, role: 'FIRST', connected: true }],
      spectators: [],
    };
    this.rooms.set(roomId, room);
    return { room, playerToken };
  }

  joinRoom(roomId: string, name: string, socketId: string): { room: RoomState; playerToken: string; role: PlayerRole } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('部屋が見つかりません');
    if (room.connections.length >= 2) throw new Error('この部屋は満員です');
    if (room.game) throw new Error('この部屋の対局は既に開始されています');

    const playerToken = nanoid();
    const creator = room.connections[0];
    const joiner: RoomConnection = { playerToken, socketId, name, role: 'SECOND', connected: true };
    // Randomize who goes first instead of always giving it to the room creator.
    if (Math.random() < 0.5) {
      creator.role = 'SECOND';
      joiner.role = 'FIRST';
    }
    room.connections.push(joiner);

    const first = room.connections.find((c) => c.role === 'FIRST')!;
    const second = room.connections.find((c) => c.role === 'SECOND')!;
    room.game = createGame({ id: first.playerToken, name: first.name }, { id: second.playerToken, name: second.name });
    return { room, playerToken, role: joiner.role };
  }

  findByToken(roomId: string, playerToken: string): { room: RoomState; connection: RoomConnection } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('部屋が見つかりません');
    const connection = room.connections.find((c) => c.playerToken === playerToken);
    if (!connection) throw new Error('プレイヤー情報が見つかりません');
    return { room, connection };
  }

  findBySocketId(socketId: string): { room: RoomState; connection: RoomConnection } | undefined {
    for (const room of this.rooms.values()) {
      const connection = room.connections.find((c) => c.socketId === socketId);
      if (connection) return { room, connection };
    }
    return undefined;
  }

  markConnected(room: RoomState, connection: RoomConnection, socketId: string): void {
    connection.socketId = socketId;
    connection.connected = true;
    if (room.game) room.game.players[connection.role].connected = true;
    if (room.disconnectTimer) {
      clearTimeout(room.disconnectTimer);
      room.disconnectTimer = undefined;
    }
  }

  markDisconnected(room: RoomState, connection: RoomConnection): void {
    connection.socketId = null;
    connection.connected = false;
    if (room.game) room.game.players[connection.role].connected = false;
    if (room.connections.every((c) => !c.connected)) {
      room.disconnectTimer = setTimeout(() => {
        if (room.turnTimer) clearTimeout(room.turnTimer);
        this.rooms.delete(room.roomId);
      }, DISCONNECT_GRACE_MS);
    }
  }

  otherConnection(room: RoomState, role: PlayerRole): RoomConnection | undefined {
    return room.connections.find((c) => c.role !== role);
  }

  addSpectator(roomId: string, name: string, socketId: string): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('部屋が見つかりません');
    if (!room.game) throw new Error('対局がまだ始まっていません');
    room.spectators.push({ socketId, name });
    return room;
  }

  // Returns the room the spectator left, if any, so the caller can notify the players.
  removeSpectatorBySocketId(socketId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      const index = room.spectators.findIndex((s) => s.socketId === socketId);
      if (index !== -1) {
        room.spectators.splice(index, 1);
        return room;
      }
    }
    return undefined;
  }
}

export const roomManager = new RoomManager();
