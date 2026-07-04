import type { Color, Hand, Tile } from './types';
import { FULL_TILE_DECK, shuffle } from './tiles';

const COLOR_ORDER: Record<Color, number> = { RED: 0, BLUE: 1, YELLOW: 2 };

// Canonical hand order: number ascending, ties broken RED before BLUE (5s are always YELLOW/YELLOW).
export function sortHand(tiles: readonly Tile[]): Hand {
  return [...tiles].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
  });
}

export interface DealResult {
  firstHand: Hand;
  secondHand: Hand;
  unusedTiles: Tile[];
}

export function dealTiles(rng: () => number = Math.random): DealResult {
  const shuffled = shuffle(FULL_TILE_DECK, rng);
  const firstHand = shuffled.slice(0, 5);
  const secondHand = shuffled.slice(5, 10);
  const unusedTiles = shuffled.slice(10);
  return {
    firstHand: sortHand(firstHand),
    secondHand: sortHand(secondHand),
    unusedTiles,
  };
}
