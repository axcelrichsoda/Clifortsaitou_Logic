import { describe, expect, it } from 'vitest';
import { resolveQuestion } from '../questionResolvers';
import type { Hand } from '../types';

// A 5-tile hand is required by the shared-info resolvers (max/min, center, sum-of-5),
// so most single-card tests below build full valid hands even when only testing a slice.

describe('card 7: sequential positions (position-based adjacency, NOT value-set based)', () => {
  it('rulebook example: (blue7, red8, blue8, red9) splits into two 2-position runs, not one 3-value run', () => {
    // Using a placeholder low tile at position 1 to keep the hand a valid 5-tile hand.
    const hand: Hand = [
      { number: 2, color: 'RED' },
      { number: 7, color: 'BLUE' },
      { number: 8, color: 'RED' },
      { number: 8, color: 'BLUE' },
      { number: 9, color: 'RED' },
    ];
    const answer = resolveQuestion(7, hand, hand);
    expect(answer).toEqual({
      kind: 'ranges',
      value: [
        { start: 2, end: 3 },
        { start: 4, end: 5 },
      ],
    });
  });

  it('reports no runs when nothing is adjacent by exactly +1', () => {
    const hand: Hand = [
      { number: 0, color: 'RED' },
      { number: 2, color: 'RED' },
      { number: 4, color: 'RED' },
      { number: 6, color: 'RED' },
      { number: 8, color: 'RED' },
    ];
    expect(resolveQuestion(7, hand, hand)).toEqual({ kind: 'ranges', value: [] });
  });

  it('merges a run of 3+ consecutive positions into a single range', () => {
    const hand: Hand = [
      { number: 1, color: 'RED' },
      { number: 2, color: 'RED' },
      { number: 3, color: 'RED' },
      { number: 4, color: 'RED' },
      { number: 9, color: 'RED' },
    ];
    expect(resolveQuestion(7, hand, hand)).toEqual({
      kind: 'ranges',
      value: [{ start: 1, end: 4 }],
    });
  });

  it('does not dedupe equal values before checking adjacency (two same-number tiles break the chain)', () => {
    // 3,3,4: position diffs are (0, 1) -> only positions 2-3 connect, not 1-2-3 as a whole
    const hand: Hand = [
      { number: 3, color: 'RED' },
      { number: 3, color: 'BLUE' },
      { number: 4, color: 'RED' },
      { number: 8, color: 'RED' },
      { number: 9, color: 'RED' },
    ];
    expect(resolveQuestion(7, hand, hand)).toEqual({
      kind: 'ranges',
      value: [
        { start: 2, end: 3 },
        { start: 4, end: 5 },
      ],
    });
  });
});

describe('card 16: adjacent same color (color-based, no ambiguity)', () => {
  it('merges 3+ consecutive same-color positions into one range', () => {
    const hand: Hand = [
      { number: 0, color: 'RED' },
      { number: 1, color: 'RED' },
      { number: 2, color: 'RED' },
      { number: 3, color: 'BLUE' },
      { number: 4, color: 'BLUE' },
    ];
    expect(resolveQuestion(16, hand, hand)).toEqual({
      kind: 'ranges',
      value: [
        { start: 1, end: 3 },
        { start: 4, end: 5 },
      ],
    });
  });
});

describe('card 5: pair count boundaries (0, 1, 2 pairs)', () => {
  it('0 pairs', () => {
    const hand: Hand = [
      { number: 0, color: 'RED' },
      { number: 1, color: 'RED' },
      { number: 2, color: 'RED' },
      { number: 3, color: 'RED' },
      { number: 4, color: 'RED' },
    ];
    expect(resolveQuestion(5, hand, hand)).toEqual({ kind: 'number', value: 0 });
  });

  it('1 pair', () => {
    const hand: Hand = [
      { number: 1, color: 'RED' },
      { number: 1, color: 'BLUE' },
      { number: 2, color: 'RED' },
      { number: 3, color: 'RED' },
      { number: 4, color: 'RED' },
    ];
    expect(resolveQuestion(5, hand, hand)).toEqual({ kind: 'number', value: 1 });
  });

  it('2 pairs (max possible in a 5-tile hand)', () => {
    const hand: Hand = [
      { number: 1, color: 'RED' },
      { number: 1, color: 'BLUE' },
      { number: 2, color: 'RED' },
      { number: 2, color: 'BLUE' },
      { number: 4, color: 'RED' },
    ];
    expect(resolveQuestion(5, hand, hand)).toEqual({ kind: 'number', value: 2 });
  });

  it('counts a matched pair of YELLOW 5s', () => {
    const hand: Hand = [
      { number: 1, color: 'RED' },
      { number: 2, color: 'RED' },
      { number: 5, color: 'YELLOW' },
      { number: 5, color: 'YELLOW' },
      { number: 9, color: 'RED' },
    ];
    expect(resolveQuestion(5, hand, hand)).toEqual({ kind: 'number', value: 1 });
  });
});

describe('position-of-number cards can return 0, 1, or 2 positions', () => {
  const handWithBothZeros: Hand = [
    { number: 0, color: 'RED' },
    { number: 0, color: 'BLUE' },
    { number: 3, color: 'RED' },
    { number: 4, color: 'RED' },
    { number: 9, color: 'RED' },
  ];
  const handWithOneZero: Hand = [
    { number: 0, color: 'RED' },
    { number: 1, color: 'RED' },
    { number: 3, color: 'RED' },
    { number: 4, color: 'RED' },
    { number: 9, color: 'RED' },
  ];
  const handWithNoZero: Hand = [
    { number: 1, color: 'RED' },
    { number: 2, color: 'RED' },
    { number: 3, color: 'RED' },
    { number: 4, color: 'RED' },
    { number: 9, color: 'RED' },
  ];

  it('card 20 (0 is at) returns both positions when both 0-tiles are held', () => {
    expect(resolveQuestion(20, handWithBothZeros, handWithBothZeros)).toEqual({
      kind: 'positions',
      value: [1, 2],
    });
  });

  it('card 20 returns a single position', () => {
    expect(resolveQuestion(20, handWithOneZero, handWithOneZero)).toEqual({
      kind: 'positions',
      value: [1],
    });
  });

  it('card 20 returns an empty array when absent', () => {
    expect(resolveQuestion(20, handWithNoZero, handWithNoZero)).toEqual({
      kind: 'positions',
      value: [],
    });
  });

  it('card 8 (5 is at) handles the double-yellow-5 case', () => {
    const hand: Hand = [
      { number: 1, color: 'RED' },
      { number: 5, color: 'YELLOW' },
      { number: 5, color: 'YELLOW' },
      { number: 8, color: 'RED' },
      { number: 9, color: 'RED' },
    ];
    expect(resolveQuestion(8, hand, hand)).toEqual({ kind: 'positions', value: [2, 3] });
  });
});

describe('choice cards (9, 12, 18, 19) dispatch on subChoice', () => {
  const hand: Hand = [
    { number: 1, color: 'RED' },
    { number: 3, color: 'RED' },
    { number: 6, color: 'RED' },
    { number: 8, color: 'RED' },
    { number: 9, color: 'RED' },
  ];

  it('card 9 with subChoice 8', () => {
    expect(resolveQuestion(9, hand, hand, 8)).toEqual({ kind: 'positions', value: [4] });
  });

  it('card 9 with subChoice 9', () => {
    expect(resolveQuestion(9, hand, hand, 9)).toEqual({ kind: 'positions', value: [5] });
  });

  it('throws on a subChoice outside the card\'s pair', () => {
    expect(() => resolveQuestion(9, hand, hand, 1)).toThrow();
  });

  it('throws when subChoice is missing for a choice card', () => {
    expect(() => resolveQuestion(12, hand, hand, undefined)).toThrow();
  });
});

describe('shared-info cards (2, 11, 17) compute both hands', () => {
  const askerHand: Hand = [
    { number: 0, color: 'RED' },
    { number: 1, color: 'RED' },
    { number: 2, color: 'RED' },
    { number: 3, color: 'RED' },
    { number: 9, color: 'RED' },
  ];
  const targetHand: Hand = [
    { number: 5, color: 'YELLOW' },
    { number: 5, color: 'YELLOW' },
    { number: 6, color: 'RED' },
    { number: 7, color: 'RED' },
    { number: 8, color: 'RED' },
  ];

  it('card 2: max - min for both hands', () => {
    expect(resolveQuestion(2, askerHand, targetHand)).toEqual({
      kind: 'shared-number',
      asker: 9,
      target: 3,
    });
  });

  it('card 11: center (position 3) >= 5 for both hands', () => {
    expect(resolveQuestion(11, askerHand, targetHand)).toEqual({
      kind: 'shared-boolean',
      asker: false, // position 3 = 2
      target: true, // position 3 = 6
    });
  });

  it('card 17: sum of all 5 tiles for both hands', () => {
    expect(resolveQuestion(17, askerHand, targetHand)).toEqual({
      kind: 'shared-number',
      asker: 15,
      target: 31,
    });
  });
});

describe('positional sum cards (4, 6, 21) slice correctly', () => {
  const hand: Hand = [
    { number: 0, color: 'RED' },
    { number: 1, color: 'RED' },
    { number: 2, color: 'RED' },
    { number: 3, color: 'RED' },
    { number: 4, color: 'RED' },
  ];

  it('card 6: smallest 3 (positions 1-3) = 0+1+2', () => {
    expect(resolveQuestion(6, hand, hand)).toEqual({ kind: 'number', value: 3 });
  });

  it('card 21: middle 3 (positions 2-4) = 1+2+3', () => {
    expect(resolveQuestion(21, hand, hand)).toEqual({ kind: 'number', value: 6 });
  });

  it('card 4: largest 3 (positions 3-5) = 2+3+4', () => {
    expect(resolveQuestion(4, hand, hand)).toEqual({ kind: 'number', value: 9 });
  });
});

describe('color/parity count cards (1, 3, 10, 13, 14, 15)', () => {
  const hand: Hand = [
    { number: 0, color: 'RED' },
    { number: 1, color: 'BLUE' },
    { number: 2, color: 'RED' },
    { number: 3, color: 'BLUE' },
    { number: 5, color: 'YELLOW' },
  ];

  it('card 1: sum of red numbers', () => {
    expect(resolveQuestion(1, hand, hand)).toEqual({ kind: 'number', value: 2 });
  });

  it('card 3: count of red tiles', () => {
    expect(resolveQuestion(3, hand, hand)).toEqual({ kind: 'number', value: 2 });
  });

  it('card 10: sum of blue numbers', () => {
    expect(resolveQuestion(10, hand, hand)).toEqual({ kind: 'number', value: 4 });
  });

  it('card 13: count of blue tiles', () => {
    expect(resolveQuestion(13, hand, hand)).toEqual({ kind: 'number', value: 2 });
  });

  it('card 14: count of even numbers (0 counts as even)', () => {
    expect(resolveQuestion(14, hand, hand)).toEqual({ kind: 'number', value: 2 });
  });

  it('card 15: count of odd numbers', () => {
    expect(resolveQuestion(15, hand, hand)).toEqual({ kind: 'number', value: 3 });
  });
});
