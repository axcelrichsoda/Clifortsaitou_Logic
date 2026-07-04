import type { Hand, Tile } from './types';
import type { QuestionCardId } from './questionCards';
import { QUESTION_CARDS } from './questionCards';
import { dealTiles } from './hand';
import { resolveQuestion, type QuestionAnswer } from './questionResolvers';
import { initQuestionDeck, consumeQuestionCard, type QuestionDeckState } from './deckManager';
import { checkDeclaration, isValidGuessSet } from './declaration';

export type PlayerRole = 'FIRST' | 'SECOND';
// LOBBY_WAITING is not a GameState phase: a GameState only exists once both players have
// joined and createGame() has dealt hands, so it always starts at IN_PROGRESS. The waiting
// room before that point is represented by the socket layer's LobbyView instead.
export type Phase = 'IN_PROGRESS' | 'AWAITING_SECOND_CHANCE' | 'FINISHED';

export interface PlayerState {
  id: string;
  name: string;
  hand: Hand;
  connected: boolean;
}

export interface QuestionLogEntry {
  cardId: QuestionCardId;
  subChoice?: number;
  askerRole: PlayerRole;
  answer: QuestionAnswer;
}

export type GameResult =
  | { type: 'WIN'; winner: PlayerRole; reason: 'DECLARE_CORRECT' | 'SECOND_CHANCE_FAILED' }
  | { type: 'DRAW'; reason: 'BOTH_CORRECT' | 'DECK_EXHAUSTED' };

export interface GameState {
  phase: Phase;
  players: Record<PlayerRole, PlayerState>;
  currentTurn: PlayerRole;
  questionDeck: QuestionDeckState;
  history: QuestionLogEntry[];
  result?: GameResult;
}

export function createGame(
  firstPlayer: { id: string; name: string },
  secondPlayer: { id: string; name: string },
  rng: () => number = Math.random
): GameState {
  const { firstHand, secondHand } = dealTiles(rng);
  return {
    phase: 'IN_PROGRESS',
    players: {
      FIRST: { id: firstPlayer.id, name: firstPlayer.name, hand: firstHand, connected: true },
      SECOND: { id: secondPlayer.id, name: secondPlayer.name, hand: secondHand, connected: true },
    },
    currentTurn: 'FIRST',
    questionDeck: initQuestionDeck(rng),
    history: [],
  };
}

function otherRole(role: PlayerRole): PlayerRole {
  return role === 'FIRST' ? 'SECOND' : 'FIRST';
}

export function askQuestion(
  state: GameState,
  role: PlayerRole,
  cardId: QuestionCardId,
  subChoice?: number
): GameState {
  if (state.phase !== 'IN_PROGRESS') throw new Error('Questions can only be asked while a game is in progress');
  if (state.currentTurn !== role) throw new Error('Not your turn');
  if (!state.questionDeck.open.includes(cardId)) throw new Error(`Card ${cardId} is not open`);

  const definition = QUESTION_CARDS[cardId];
  if (definition.category === 'CHOICE') {
    if (subChoice === undefined || !definition.choices?.includes(subChoice)) {
      throw new Error(`Invalid subChoice for card ${cardId}`);
    }
  } else if (subChoice !== undefined) {
    throw new Error(`Card ${cardId} does not take a subChoice`);
  }

  const target = otherRole(role);
  const answer = resolveQuestion(cardId, state.players[role].hand, state.players[target].hand, subChoice);
  const { deck, exhausted } = consumeQuestionCard(state.questionDeck, cardId);

  const historyEntry: QuestionLogEntry = { cardId, subChoice, askerRole: role, answer };

  if (exhausted) {
    return {
      ...state,
      questionDeck: deck,
      history: [...state.history, historyEntry],
      phase: 'FINISHED',
      result: { type: 'DRAW', reason: 'DECK_EXHAUSTED' },
    };
  }

  return {
    ...state,
    questionDeck: deck,
    history: [...state.history, historyEntry],
    currentTurn: target,
  };
}

export function declare(state: GameState, role: PlayerRole, guess: readonly Tile[]): GameState {
  if (state.phase !== 'IN_PROGRESS' && state.phase !== 'AWAITING_SECOND_CHANCE') {
    throw new Error('Declarations can only be made while a game is in progress');
  }
  if (!isValidGuessSet(guess)) throw new Error('Invalid guess: not a possible set of 5 tiles');

  if (state.phase === 'AWAITING_SECOND_CHANCE') {
    if (role !== 'SECOND') throw new Error('Only the second player may take the final declaration');
    const correct = checkDeclaration(guess, state.players.FIRST.hand);
    return {
      ...state,
      phase: 'FINISHED',
      result: correct
        ? { type: 'DRAW', reason: 'BOTH_CORRECT' }
        : { type: 'WIN', winner: 'FIRST', reason: 'SECOND_CHANCE_FAILED' },
    };
  }

  if (state.currentTurn !== role) throw new Error('Not your turn');
  const target = otherRole(role);
  const correct = checkDeclaration(guess, state.players[target].hand);

  if (!correct) {
    return { ...state, currentTurn: target };
  }

  if (role === 'FIRST') {
    return { ...state, phase: 'AWAITING_SECOND_CHANCE', currentTurn: 'SECOND' };
  }

  return { ...state, phase: 'FINISHED', result: { type: 'WIN', winner: 'SECOND', reason: 'DECLARE_CORRECT' } };
}

export function forfeitSecondChance(state: GameState, role: PlayerRole): GameState {
  if (state.phase !== 'AWAITING_SECOND_CHANCE') throw new Error('No second chance is pending');
  if (role !== 'SECOND') throw new Error('Only the second player may forfeit the final declaration');
  return {
    ...state,
    phase: 'FINISHED',
    result: { type: 'WIN', winner: 'FIRST', reason: 'SECOND_CHANCE_FAILED' },
  };
}
