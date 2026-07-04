'use client';

import type { Color } from '@/engine/types';
import { useMemoGrid } from '@/hooks/useMemoGrid';

const NUMBERS = Array.from({ length: 10 }, (_, i) => i);
const ROWS: readonly Color[] = ['RED', 'BLUE'];

// A shared, game-long 0-9 x 2-color grid the player taps to cross out combinations they've
// deduced are impossible. Number 5 only exists as YELLOW tiles, so it renders as YELLOW in
// both rows (one cell per physical 5 tile) instead of RED/BLUE.
export function MemoGrid({ roomId }: { roomId: string }) {
  const { crossedOut, toggle } = useMemoGrid(roomId);

  return (
    <div className="memo-grid">
      {ROWS.map((rowColor) => (
        <div className="memo-row" key={rowColor}>
          {NUMBERS.map((n) => {
            const key = `${rowColor}-${n}`;
            const displayColor: Color = n === 5 ? 'YELLOW' : rowColor;
            const crossed = crossedOut.has(key);
            return (
              <button
                key={key}
                type="button"
                className={`tile tile-${displayColor} memo-cell ${crossed ? 'crossed' : ''}`}
                onClick={() => toggle(key)}
                aria-pressed={crossed}
                title="タップで候補から消す/戻す"
              >
                {n}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
