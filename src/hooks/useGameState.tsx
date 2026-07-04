'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSocket } from './useSocket';
import type { LobbyView, RoomOrGameView } from '@server/socket/types/socketEvents';
import type { Color } from '@/engine/types';
import type { SpectatorView } from '@/engine/gameView';

interface Session {
  roomId: string;
  playerToken: string;
}

const SESSION_KEY = 'tagiron:session';

function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

interface GameContextValue {
  connected: boolean;
  view: RoomOrGameView | null;
  roomId: string | null;
  error: string | null;
  lastDeclareCorrect: boolean | null;
  isSpectator: boolean;
  spectatorView: SpectatorView | null;
  spectatorCount: number;
  clearError: () => void;
  createRoom: (name: string) => void;
  joinRoom: (roomId: string, name: string) => void;
  spectateRoom: (roomId: string, name: string) => void;
  rejoin: (roomId: string) => boolean;
  askQuestion: (cardId: number, subChoice?: number) => void;
  declareHand: (guess: { number: number; color: Color }[]) => void;
  forfeitSecondChance: () => void;
  leaveRoom: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, connected } = useSocket();
  const [view, setView] = useState<RoomOrGameView | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastDeclareCorrect, setLastDeclareCorrect] = useState<boolean | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorView, setSpectatorView] = useState<SpectatorView | null>(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    function onCreated(payload: { roomId: string; playerToken: string; view: LobbyView }) {
      sessionRef.current = { roomId: payload.roomId, playerToken: payload.playerToken };
      saveSession(sessionRef.current);
      setRoomId(payload.roomId);
      setView(payload.view);
      setError(null);
    }
    function onJoined(payload: { roomId: string; playerToken: string; view: RoomOrGameView }) {
      sessionRef.current = { roomId: payload.roomId, playerToken: payload.playerToken };
      saveSession(sessionRef.current);
      setRoomId(payload.roomId);
      setView(payload.view);
      setError(null);
    }
    function onError(payload: { message: string }) {
      setError(payload.message);
    }
    function onView(payload: { view: RoomOrGameView }) {
      setView(payload.view);
    }
    function onDeclareResult(payload: { correct: boolean; view: RoomOrGameView }) {
      setLastDeclareCorrect(payload.correct);
      setView(payload.view);
    }
    function onSpectatorJoined(payload: { roomId: string; view: SpectatorView }) {
      setIsSpectator(true);
      setRoomId(payload.roomId);
      setSpectatorView(payload.view);
      setError(null);
    }
    function onSpectatorUpdate(payload: { view: SpectatorView }) {
      setSpectatorView(payload.view);
    }
    function onSpectatorCountChanged(payload: { count: number }) {
      setSpectatorCount(payload.count);
    }

    socket.on('room:created', onCreated);
    socket.on('room:joined', onJoined);
    socket.on('room:error', onError);
    socket.on('game:started', onView);
    socket.on('game:question-asked', onView);
    socket.on('game:declare-result', onDeclareResult);
    socket.on('game:second-chance-opportunity', onView);
    socket.on('game:over', onView);
    socket.on('player:reconnected', onView);
    socket.on('spectator:joined', onSpectatorJoined);
    socket.on('spectator:update', onSpectatorUpdate);
    socket.on('spectator:count-changed', onSpectatorCountChanged);

    return () => {
      socket.off('room:created', onCreated);
      socket.off('room:joined', onJoined);
      socket.off('room:error', onError);
      socket.off('game:started', onView);
      socket.off('game:question-asked', onView);
      socket.off('game:declare-result', onDeclareResult);
      socket.off('game:second-chance-opportunity', onView);
      socket.off('game:over', onView);
      socket.off('player:reconnected', onView);
      socket.off('spectator:joined', onSpectatorJoined);
      socket.off('spectator:update', onSpectatorUpdate);
      socket.off('spectator:count-changed', onSpectatorCountChanged);
    };
  }, [socket]);

  const clearError = useCallback(() => setError(null), []);

  const createRoom = useCallback(
    (name: string) => {
      setError(null);
      socket.emit('room:create', { name });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomId: string, name: string) => {
      setError(null);
      socket.emit('room:join', { roomId, name });
    },
    [socket]
  );

  const spectateRoom = useCallback(
    (roomId: string, name: string) => {
      setError(null);
      socket.emit('room:spectate', { roomId, name });
    },
    [socket]
  );

  const rejoin = useCallback(
    (roomId: string) => {
      const session = loadSession();
      if (!session || session.roomId.toUpperCase() !== roomId.toUpperCase()) return false;
      sessionRef.current = session;
      setRoomId(session.roomId);
      socket.emit('room:rejoin', { roomId, playerToken: session.playerToken });
      return true;
    },
    [socket]
  );

  const askQuestion = useCallback(
    (cardId: number, subChoice?: number) => {
      socket.emit('game:ask-question', { cardId, subChoice });
    },
    [socket]
  );

  const declareHand = useCallback(
    (guess: { number: number; color: Color }[]) => {
      socket.emit('game:declare', { guess });
    },
    [socket]
  );

  const forfeitSecondChance = useCallback(() => {
    socket.emit('game:forfeit-second-chance');
  }, [socket]);

  const leaveRoom = useCallback(() => {
    clearStoredSession();
    sessionRef.current = null;
    setRoomId(null);
    setView(null);
    setLastDeclareCorrect(null);
    setIsSpectator(false);
    setSpectatorView(null);
    setSpectatorCount(0);
  }, []);

  const value: GameContextValue = {
    connected,
    view,
    roomId,
    error,
    lastDeclareCorrect,
    isSpectator,
    spectatorView,
    spectatorCount,
    clearError,
    createRoom,
    joinRoom,
    spectateRoom,
    rejoin,
    askQuestion,
    declareHand,
    forfeitSecondChance,
    leaveRoom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used within a GameProvider');
  return ctx;
}
