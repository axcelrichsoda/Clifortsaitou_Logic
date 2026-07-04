'use client';

import { useCallback, useEffect, useState } from 'react';

function memoStorageKey(roomId: string): string {
  return `tagiron:memo:${roomId}`;
}

function loadMemo(roomId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(memoStorageKey(roomId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

// Shared, game-long scratchpad for crossing out impossible number+color combinations.
// Purely a client-side note to the player: never sent to the server, no effect on gameplay.
export function useMemoGrid(roomId: string) {
  const [crossedOut, setCrossedOut] = useState<Set<string>>(() => loadMemo(roomId));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(memoStorageKey(roomId), JSON.stringify([...crossedOut]));
  }, [roomId, crossedOut]);

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
