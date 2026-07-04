import type { Hand, Tile } from './types';
import { sortHand } from './hand';

// Hands are always kept canonically sorted, so guessing the correct 5 tiles is
// equivalent to guessing their positions too. We canonicalize the guess before
// comparing so submission order never matters, only the actual set of tiles.
export function checkDeclaration(guess: readonly Tile[], actualHand: Hand): boolean {
  if (guess.length !== actualHand.length) return false;
  const sortedGuess = sortHand(guess);
  return sortedGuess.every(
    (t, i) => t.number === actualHand[i].number && t.color === actualHand[i].color
  );
}

// Ensures a guess is physically possible given the fixed 20-tile deck
// (at most one RED and one BLUE per non-5 number, at most two YELLOW 5s).
export function isValidGuessSet(guess: readonly Tile[]): boolean {
  if (guess.length !== 5) return false;
  const counts = new Map<string, number>();
  for (const t of guess) {
    if (!Number.isInteger(t.number) || t.number < 0 || t.number > 9) return false;
    if (t.number === 5 && t.color !== 'YELLOW') return false;
    if (t.number !== 5 && t.color === 'YELLOW') return false;
    const key = `${t.color}-${t.number}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [key, count] of counts) {
    const maxAllowed = key.startsWith('YELLOW') ? 2 : 1;
    if (count > maxAllowed) return false;
  }
  return true;
}
