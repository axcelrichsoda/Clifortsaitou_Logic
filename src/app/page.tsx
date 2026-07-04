'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/hooks/useGameState';
import { CreateRoomForm } from '@/components/lobby/CreateRoomForm';
import { JoinRoomForm } from '@/components/lobby/JoinRoomForm';
import { SpectateForm } from '@/components/lobby/SpectateForm';

export default function Home() {
  const router = useRouter();
  const { roomId, error, clearError } = useGameState();

  useEffect(() => {
    if (roomId) router.push(`/room/${roomId}`);
  }, [roomId, router]);

  return (
    <div className="page-container">
      <h1 className="page-title">TAGIRON オンライン対戦</h1>
      <p>友人と2人でリアルタイム対戦できます。部屋を作るか、教えてもらった部屋コードで参加してください。</p>
      {error && (
        <div className="error-banner" onClick={clearError} role="button" tabIndex={0}>
          {error}
        </div>
      )}
      <CreateRoomForm />
      <JoinRoomForm />
      <SpectateForm />
    </div>
  );
}
