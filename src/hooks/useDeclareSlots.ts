'use client';

import { useEffect, useState } from 'react';
import type { PlayerRole } from '@/engine/gameState';
import type { Color } from '@/engine/types';

export interface Slot {
  number: number;
  color: Color | null; // null = color not yet determined ("不明")
}

function defaultSlots(): Slot[] {
  return Array.from({ length: 5 }, () => ({ number: 0, color: null as Color | null }));
}

function isValidSlots(value: unknown): value is Slot[] {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    value.every(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as Slot).number === 'number' &&
        ((s as Slot).color === null || typeof (s as Slot).color === 'string')
    )
  );
}

// Keyed by roomId AND role, matching useMemoGrid, so each player's in-progress guess is
// independent even if both players share a browser.
function storageKey(roomId: string, yourRole: PlayerRole): string {
  return `tagiron:declare-slots:${roomId}:${yourRole}`;
}

function loadSlots(roomId: string, yourRole: PlayerRole): Slot[] {
  if (typeof window === 'undefined') return defaultSlots();
  try {
    const raw = window.localStorage.getItem(storageKey(roomId, yourRole));
    if (!raw) return defaultSlots();
    const parsed = JSON.parse(raw);
    return isValidSlots(parsed) ? parsed : defaultSlots();
  } catch {
    return defaultSlots();
  }
}

// The 5 declare-slot number/color guesses the player has entered so far, private to one
// player. Persisted across the IN_PROGRESS -> AWAITING_SECOND_CHANCE transition, which
// remounts the guess board in a new location (SecondChanceBanner) but keeps the same
// roomId+role key, so previously entered candidates aren't lost when the final chance opens.
export function useDeclareSlots(roomId: string, yourRole: PlayerRole) {
  const [slots, setSlots] = useState<Slot[]>(() => loadSlots(roomId, yourRole));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey(roomId, yourRole), JSON.stringify(slots));
  }, [roomId, yourRole, slots]);

  return [slots, setSlots] as const;
}
