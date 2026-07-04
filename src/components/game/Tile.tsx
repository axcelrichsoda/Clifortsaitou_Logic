import type { Tile as TileType } from '@/engine/types';

export function Tile({ tile }: { tile: TileType }) {
  return <div className={`tile tile-${tile.color}`}>{tile.number}</div>;
}

export function TilePlaceholder() {
  return <div className="tile tile-placeholder">?</div>;
}
