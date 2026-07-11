'use client';

import { useEffect, useState } from 'react';
import { TURN_TIME_LIMIT_MS } from '@/engine/gameState';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Purely a visual countdown: the server is authoritative and ends the game on timeout
// regardless of what the client displays, so drift here has no gameplay consequence.
export function TurnTimer({ turnStartedAt }: { turnStartedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [turnStartedAt]);

  const remaining = turnStartedAt + TURN_TIME_LIMIT_MS - now;
  const urgent = remaining <= 30_000;

  return (
    <span className={`turn-timer ${urgent ? 'turn-timer-urgent' : ''}`}>持ち時間 残り {formatRemaining(remaining)}</span>
  );
}
