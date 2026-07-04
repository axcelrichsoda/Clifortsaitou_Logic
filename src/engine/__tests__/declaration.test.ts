import { describe, expect, it } from 'vitest';
import { checkDeclaration, isValidGuessSet } from '../declaration';
import type { Hand } from '../types';

const actualHand: Hand = [
  { number: 0, color: 'RED' },
  { number: 3, color: 'BLUE' },
  { number: 5, color: 'YELLOW' },
  { number: 7, color: 'RED' },
  { number: 9, color: 'BLUE' },
];

describe('checkDeclaration', () => {
  it('matches when the guess contains exactly the right 5 tiles, regardless of submission order', () => {
    const guess = [
      { number: 9, color: 'BLUE' as const },
      { number: 0, color: 'RED' as const },
      { number: 7, color: 'RED' as const },
      { number: 5, color: 'YELLOW' as const },
      { number: 3, color: 'BLUE' as const },
    ];
    expect(checkDeclaration(guess, actualHand)).toBe(true);
  });

  it('rejects a guess that is off by one tile', () => {
    const guess = [
      { number: 0, color: 'RED' as const },
      { number: 3, color: 'BLUE' as const },
      { number: 5, color: 'YELLOW' as const },
      { number: 7, color: 'RED' as const },
      { number: 8, color: 'BLUE' as const }, // wrong, should be 9
    ];
    expect(checkDeclaration(guess, actualHand)).toBe(false);
  });

  it('rejects a guess with the right number but wrong color', () => {
    const guess = [
      { number: 0, color: 'BLUE' as const }, // wrong color, should be RED
      { number: 3, color: 'BLUE' as const },
      { number: 5, color: 'YELLOW' as const },
      { number: 7, color: 'RED' as const },
      { number: 9, color: 'BLUE' as const },
    ];
    expect(checkDeclaration(guess, actualHand)).toBe(false);
  });
});

describe('isValidGuessSet', () => {
  it('accepts a physically possible set of 5 tiles', () => {
    expect(
      isValidGuessSet([
        { number: 0, color: 'RED' },
        { number: 3, color: 'BLUE' },
        { number: 5, color: 'YELLOW' },
        { number: 5, color: 'YELLOW' },
        { number: 9, color: 'BLUE' },
      ])
    ).toBe(true);
  });

  it('rejects duplicate non-5 tiles (only one RED-3 exists)', () => {
    expect(
      isValidGuessSet([
        { number: 3, color: 'RED' },
        { number: 3, color: 'RED' },
        { number: 5, color: 'YELLOW' },
        { number: 5, color: 'YELLOW' },
        { number: 9, color: 'BLUE' },
      ])
    ).toBe(false);
  });

  it('rejects a 5 tile with a non-YELLOW color', () => {
    expect(
      isValidGuessSet([
        { number: 5, color: 'RED' },
        { number: 1, color: 'RED' },
        { number: 2, color: 'RED' },
        { number: 3, color: 'RED' },
        { number: 4, color: 'RED' },
      ])
    ).toBe(false);
  });

  it('rejects a guess that is not exactly 5 tiles', () => {
    expect(isValidGuessSet([{ number: 0, color: 'RED' }])).toBe(false);
  });
});
