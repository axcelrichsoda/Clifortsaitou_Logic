import type { PositionRange, QuestionAnswer } from '@/engine/questionResolvers';
import { QUESTION_CARDS, type QuestionCardId } from '@/engine/questionCards';
import type { Color, Tile } from '@/engine/types';

const COLOR_LABEL: Record<Color, string> = { RED: '赤', BLUE: '青', YELLOW: '黄' };

export function formatGuess(guess: readonly Tile[]): string {
  return guess.map((t) => `${COLOR_LABEL[t.color]}${t.number}`).join('・');
}

function formatPositions(positions: number[]): string {
  if (positions.length === 0) return '該当なし';
  return `位置 ${positions.join(', ')}`;
}

function formatRanges(ranges: PositionRange[]): string {
  if (ranges.length === 0) return '該当なし';
  return ranges.map((r) => (r.start === r.end ? `位置${r.start}` : `位置${r.start}-${r.end}`)).join(' / ');
}

// `askerLabel`/`targetLabel`: display names for whoever asked and whoever was asked about
// (e.g. "あなた"/"相手" from a player's own perspective, or actual names for a spectator).
// Non-shared answers always describe the *target* hand (the person who was asked about).
export function formatAnswerValue(answer: QuestionAnswer, askerLabel: string, targetLabel: string): string {
  switch (answer.kind) {
    case 'number':
      return `${targetLabel}: ${answer.value}`;
    case 'boolean':
      return `${targetLabel}: ${answer.value ? 'はい' : 'いいえ'}`;
    case 'positions':
      return `${targetLabel}の${formatPositions(answer.value)}`;
    case 'ranges':
      return `${targetLabel}の${formatRanges(answer.value)}`;
    case 'shared-number':
      return `${askerLabel}: ${answer.asker} / ${targetLabel}: ${answer.target}`;
    case 'shared-boolean':
      return `${askerLabel}: ${answer.asker ? 'はい' : 'いいえ'} / ${targetLabel}: ${answer.target ? 'はい' : 'いいえ'}`;
    default:
      return '';
  }
}

export function describeQuestion(entry: { cardId: QuestionCardId; subChoice?: number }): string {
  const def = QUESTION_CARDS[entry.cardId];
  if (def.category === 'CHOICE' && entry.subChoice !== undefined) {
    return `${def.label}(選択: ${entry.subChoice})`;
  }
  return def.label;
}
