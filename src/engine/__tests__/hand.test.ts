import { describe, expect, it } from 'vitest';
import { dealTiles, sortHand } from '../hand';
import { FULL_TILE_DECK, tileKey } from '../tiles';

describe('sortHand', () => {
  it('sorts ascending by number, ties broken RED before BLUE', () => {
    const sorted = sortHand([
      { number: 3, color: 'BLUE' },
      { number: 1, color: 'RED' },
      { number: 3, color: 'RED' },
      { number: 0, color: 'BLUE' },
      { number: 5, color: 'YELLOW' },
    ]);
    expect(sorted).toEqual([
      { number: 0, color: 'BLUE' },
      { number: 1, color: 'RED' },
      { number: 3, color: 'RED' },
      { number: 3, color: 'BLUE' },
      { number: 5, color: 'YELLOW' },
    ]);
  });
});

describe('dealTiles', () => {
  it('deals 5 sorted tiles to each player and leaves 10 unused, with no overlap', () => {
    const { firstHand, secondHand, unusedTiles } = dealTiles(() => 0.42);
    expect(firstHand).toHaveLength(5);
    expect(secondHand).toHaveLength(5);
    expect(unusedTiles).toHaveLength(10);

    const allKeys = [...firstHand, ...secondHand, ...unusedTiles].map(tileKey);
    // No duplicate tile *instances* beyond what the deck actually contains.
    const deckKeys = FULL_TILE_DECK.map(tileKey).sort();
    expect(allKeys.sort()).toEqual(deckKeys);

    expect(firstHand).toEqual(sortHand(firstHand));
    expect(secondHand).toEqual(sortHand(secondHand));
  });

  it('is deterministic for a given rng', () => {
    let seed = 1;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const a = dealTiles(rng);
    seed = 1;
    const b = dealTiles(rng);
    expect(a).toEqual(b);
  });
});
