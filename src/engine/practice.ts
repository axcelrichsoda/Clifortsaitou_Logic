import type { Hand, Tile } from './types';
import { dealTiles } from './hand';
import { resolveQuestion, type QuestionAnswer } from './questionResolvers';
import { initQuestionDeck, consumeQuestionCard, type QuestionDeckState } from './deckManager';
import { checkDeclaration, isValidGuessSet } from './declaration';
import { QUESTION_CARDS, type QuestionCardId } from './questionCards';

export interface PracticeQuestionEntry {
  type: 'QUESTION';
  cardId: QuestionCardId;
  subChoice?: number;
  answer: QuestionAnswer;
}

export interface PracticeDeclareEntry {
  type: 'DECLARE';
  guess: Tile[];
  correct: boolean;
}

export type PracticeHistoryEntry = PracticeQuestionEntry | PracticeDeclareEntry;

// A single-player practice round: no turns, no opponent, no time limit. `yourHand` exists
// purely so SHARED-category questions (which report both the asker's and target's values)
// have something meaningful to show on the "asker" side, mirroring the real 2-player rules.
export interface PracticeState {
  yourHand: Hand;
  targetHand: Hand;
  questionDeck: QuestionDeckState;
  history: PracticeHistoryEntry[];
  deckExhausted: boolean;
  won: boolean;
}

export function createPracticeState(rng: () => number = Math.random): PracticeState {
  const { firstHand, secondHand } = dealTiles(rng);
  return {
    yourHand: firstHand,
    targetHand: secondHand,
    questionDeck: initQuestionDeck(rng),
    history: [],
    deckExhausted: false,
    won: false,
  };
}

export function askPracticeQuestion(
  state: PracticeState,
  cardId: QuestionCardId,
  subChoice?: number
): PracticeState {
  if (state.won) throw new Error('This practice round is already won');
  if (state.deckExhausted) throw new Error('No question cards remain');
  if (!state.questionDeck.open.includes(cardId)) throw new Error(`Card ${cardId} is not open`);

  const definition = QUESTION_CARDS[cardId];
  if (definition.category === 'CHOICE') {
    if (subChoice === undefined || !definition.choices?.includes(subChoice)) {
      throw new Error(`Invalid subChoice for card ${cardId}`);
    }
  } else if (subChoice !== undefined) {
    throw new Error(`Card ${cardId} does not take a subChoice`);
  }

  const answer = resolveQuestion(cardId, state.yourHand, state.targetHand, subChoice);
  const { deck, exhausted } = consumeQuestionCard(state.questionDeck, cardId);
  const entry: PracticeQuestionEntry = { type: 'QUESTION', cardId, subChoice, answer };

  return {
    ...state,
    questionDeck: deck,
    history: [...state.history, entry],
    deckExhausted: exhausted,
  };
}

// Unlike the real game, an incorrect declaration doesn't end anything or pass a turn — there's
// no opponent to benefit, so the player can just keep asking (if cards remain) and try again.
export function declarePractice(state: PracticeState, guess: readonly Tile[]): PracticeState {
  if (state.won) throw new Error('This practice round is already won');
  if (!isValidGuessSet(guess)) throw new Error('Invalid guess: not a possible set of 5 tiles');

  const correct = checkDeclaration(guess, state.targetHand);
  const entry: PracticeDeclareEntry = { type: 'DECLARE', guess: [...guess], correct };
  return {
    ...state,
    history: [...state.history, entry],
    won: correct,
  };
}
