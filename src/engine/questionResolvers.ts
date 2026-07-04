import type { Color, Hand, Tile } from './types';
import type { QuestionCardId } from './questionCards';
import { QUESTION_CARDS } from './questionCards';

export interface PositionRange {
  start: number; // 1-indexed, inclusive
  end: number; // 1-indexed, inclusive
}

export type QuestionAnswer =
  | { kind: 'number'; value: number }
  | { kind: 'positions'; value: number[] }
  | { kind: 'ranges'; value: PositionRange[] }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'shared-number'; asker: number; target: number }
  | { kind: 'shared-boolean'; asker: boolean; target: boolean };

function sumAll(hand: Hand): number {
  return hand.reduce((s, t) => s + t.number, 0);
}

function sumByColor(hand: Hand, color: Color): number {
  return hand.filter((t) => t.color === color).reduce((s, t) => s + t.number, 0);
}

function countByColor(hand: Hand, color: Color): number {
  return hand.filter((t) => t.color === color).length;
}

function sumSlice(hand: Hand, startIdx: number, endIdxExclusive: number): number {
  return hand.slice(startIdx, endIdxExclusive).reduce((s, t) => s + t.number, 0);
}

function maxMinDiff(hand: Hand): number {
  const numbers = hand.map((t) => t.number);
  return Math.max(...numbers) - Math.min(...numbers);
}

function isCenterHighOrEqual(hand: Hand): boolean {
  return hand[2].number >= 5;
}

function positionsOfNumber(hand: Hand, n: number): number[] {
  const positions: number[] = [];
  hand.forEach((t, i) => {
    if (t.number === n) positions.push(i + 1);
  });
  return positions;
}

function pairCount(hand: Hand): number {
  const counts = new Map<number, number>();
  for (const t of hand) counts.set(t.number, (counts.get(t.number) ?? 0) + 1);
  let pairs = 0;
  for (const c of counts.values()) if (c === 2) pairs += 1;
  return pairs;
}

// Finds maximal runs of consecutive positions where `connected(hand[i], hand[i+1])` holds.
// Used by card 7 (numeric diff === 1) and card 16 (same color). A run must span >= 2 positions.
function findRuns(hand: Hand, connected: (a: Tile, b: Tile) => boolean): PositionRange[] {
  const runs: PositionRange[] = [];
  let runStart: number | null = null;
  for (let i = 0; i < hand.length - 1; i++) {
    if (connected(hand[i], hand[i + 1])) {
      if (runStart === null) runStart = i + 1;
    } else if (runStart !== null) {
      runs.push({ start: runStart, end: i + 1 });
      runStart = null;
    }
  }
  if (runStart !== null) {
    runs.push({ start: runStart, end: hand.length });
  }
  return runs;
}

function requireChoice(cardId: QuestionCardId, subChoice: number | undefined): number {
  const choices = QUESTION_CARDS[cardId].choices;
  if (!choices) throw new Error(`Card ${cardId} is not a choice card`);
  if (subChoice === undefined || !choices.includes(subChoice)) {
    throw new Error(`Invalid subChoice ${subChoice} for card ${cardId}; expected one of ${choices}`);
  }
  return subChoice;
}

type ResolverFn = (askerHand: Hand, targetHand: Hand, subChoice: number | undefined) => QuestionAnswer;

// Record type over the QuestionCardId union: TypeScript will error if any card id is missing.
const RESOLVERS: Record<QuestionCardId, ResolverFn> = {
  1: (_asker, target) => ({ kind: 'number', value: sumByColor(target, 'RED') }),
  2: (asker, target) => ({ kind: 'shared-number', asker: maxMinDiff(asker), target: maxMinDiff(target) }),
  3: (_asker, target) => ({ kind: 'number', value: countByColor(target, 'RED') }),
  4: (_asker, target) => ({ kind: 'number', value: sumSlice(target, 2, 5) }),
  5: (_asker, target) => ({ kind: 'number', value: pairCount(target) }),
  6: (_asker, target) => ({ kind: 'number', value: sumSlice(target, 0, 3) }),
  7: (_asker, target) => ({ kind: 'ranges', value: findRuns(target, (a, b) => b.number - a.number === 1) }),
  8: (_asker, target) => ({ kind: 'positions', value: positionsOfNumber(target, 5) }),
  9: (_asker, target, sub) => ({ kind: 'positions', value: positionsOfNumber(target, requireChoice(9, sub)) }),
  10: (_asker, target) => ({ kind: 'number', value: sumByColor(target, 'BLUE') }),
  11: (asker, target) => ({
    kind: 'shared-boolean',
    asker: isCenterHighOrEqual(asker),
    target: isCenterHighOrEqual(target),
  }),
  12: (_asker, target, sub) => ({ kind: 'positions', value: positionsOfNumber(target, requireChoice(12, sub)) }),
  13: (_asker, target) => ({ kind: 'number', value: countByColor(target, 'BLUE') }),
  14: (_asker, target) => ({ kind: 'number', value: target.filter((t) => t.number % 2 === 0).length }),
  15: (_asker, target) => ({ kind: 'number', value: target.filter((t) => t.number % 2 === 1).length }),
  16: (_asker, target) => ({ kind: 'ranges', value: findRuns(target, (a, b) => a.color === b.color) }),
  17: (asker, target) => ({ kind: 'shared-number', asker: sumAll(asker), target: sumAll(target) }),
  18: (_asker, target, sub) => ({ kind: 'positions', value: positionsOfNumber(target, requireChoice(18, sub)) }),
  19: (_asker, target, sub) => ({ kind: 'positions', value: positionsOfNumber(target, requireChoice(19, sub)) }),
  20: (_asker, target) => ({ kind: 'positions', value: positionsOfNumber(target, 0) }),
  21: (_asker, target) => ({ kind: 'number', value: sumSlice(target, 1, 4) }),
};

export function resolveQuestion(
  cardId: QuestionCardId,
  askerHand: Hand,
  targetHand: Hand,
  subChoice?: number
): QuestionAnswer {
  return RESOLVERS[cardId](askerHand, targetHand, subChoice);
}
