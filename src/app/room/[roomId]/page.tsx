'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameState } from '@/hooks/useGameState';
import { WaitingRoom } from '@/components/lobby/WaitingRoom';
import { GameBoard } from '@/components/game/GameBoard';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { SpectatorBoard } from '@/components/game/SpectatorBoard';
import { SpectatorGameOverScreen } from '@/components/game/SpectatorGameOverScreen';

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomIdParam = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const router = useRouter();
  const {
    view,
    isSpectator,
    spectatorView,
    spectatorCount,
    connected,
    error,
    clearError,
    rejoin,
    askQuestion,
    declareHand,
    forfeitSecondChance,
    leaveRoom,
  } = useGameState();
  const attemptedRejoin = useRef(false);

  useEffect(() => {
    if (!connected || view || spectatorView || isSpectator || attemptedRejoin.current || !roomIdParam) return;
    attemptedRejoin.current = true;
    const ok = rejoin(roomIdParam);
    if (!ok) router.replace('/');
  }, [connected, view, spectatorView, isSpectator, roomIdParam, rejoin, router]);

  function backToLobby() {
    leaveRoom();
    router.push('/');
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-banner" onClick={clearError} role="button" tabIndex={0}>
          {error}
        </div>
        <button className="btn" onClick={backToLobby}>
          トップに戻る
        </button>
      </div>
    );
  }

  if (isSpectator) {
    if (!spectatorView) {
      return (
        <div className="page-container">
          <p>読み込み中…</p>
        </div>
      );
    }
    if (spectatorView.phase === 'FINISHED') {
      return <SpectatorGameOverScreen view={spectatorView} onBackToLobby={backToLobby} />;
    }
    return <SpectatorBoard view={spectatorView} />;
  }

  if (!view) {
    return (
      <div className="page-container">
        <p>読み込み中…</p>
      </div>
    );
  }

  if (view.phase === 'LOBBY_WAITING') {
    return (
      <div className="page-container">
        <WaitingRoom view={view} />
      </div>
    );
  }

  if (view.phase === 'FINISHED') {
    return <GameOverScreen view={view} onBackToLobby={backToLobby} />;
  }

  return (
    <GameBoard
      view={view}
      roomId={roomIdParam ?? ''}
      spectatorCount={spectatorCount}
      onAskQuestion={askQuestion}
      onDeclare={declareHand}
      onForfeitSecondChance={forfeitSecondChance}
    />
  );
}
