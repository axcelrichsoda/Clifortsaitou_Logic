import type { Hand } from '@/engine/types';
import { Tile } from './Tile';

export function HandDisplay({ hand, title }: { hand: Hand; title: string }) {
  return (
    <div className="panel">
      <div className="panel-title">{title}</div>
      <div className="hand-display">
        {hand.map((tile, i) => (
          <div className="hand-slot" key={i}>
            <Tile tile={tile} />
            <span className="position-label">位置{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
