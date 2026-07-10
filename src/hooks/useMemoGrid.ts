'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PlayerRole } from '@/engine/gameState';

// Keyed by roomId AND role so that FIRST's and SECOND's marks never collide when both
// players happen to share the same browser (e.g. two tabs while testing solo).
function memoStorageKey(roomId: string, yourRole: PlayerRole): string {
  return `tagiron:memo:${roomId}:${yourRole}`;
}

function loadMemo(roomId: string, yourRole: PlayerRole): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(memoStorageKey(roomId, yourRole));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

// Game-long scratchpad for crossing out impossible number+color combinations, private to
// one player. Purely a client-side note: never sent to the server, no effect on gameplay.
// Persisted across the IN_PROGRESS -> AWAITING_SECOND_CHANCE transition, which remounts the
// guess board in a new location (SecondChanceBanner) but keeps the same roomId+role key.
export function useMemoGrid(roomId: string, yourRole: PlayerRole) {
  const [crossedOut, setCrossedOut] = useState<Set<string>>(() => loadMemo(roomId, yourRole));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(memoStorageKey(roomId, yourRole), JSON.stringify([...crossedOut]));
  }, [roomId, yourRole, crossedOut]);

  const toggle = useCallback((key: string) => {
    setCrossedOut((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { crossedOut, toggle };
}
