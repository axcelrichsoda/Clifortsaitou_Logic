import type { Tile } from './types';

export function tileKey(tile: Tile): string {
  return `${tile.color}-${tile.number}`;
}

export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.number === b.number && a.color === b.color;
}

// 20 tiles total: 0,1,2,3,4,6,7,8,9 each RED+BLUE (18 tiles), plus two YELLOW 5s.
export const FULL_TILE_DECK: readonly Tile[] = (() => {
  const tiles: Tile[] = [];
  for (const n of [0, 1, 2, 3, 4, 6, 7, 8, 9]) {
    tiles.push({ number: n, color: 'RED' });
    tiles.push({ number: n, color: 'BLUE' });
  }
  tiles.push({ number: 5, color: 'YELLOW' });
  tiles.push({ number: 5, color: 'YELLOW' });
  return tiles;
})();

export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
