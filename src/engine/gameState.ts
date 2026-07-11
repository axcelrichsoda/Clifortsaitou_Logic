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
  type: 'QUESTION';
  cardId: QuestionCardId;
  subChoice?: number;
  askerRole: PlayerRole;
  answer: QuestionAnswer;
}

// Recorded whenever a declaration misses, so the question log can show that a declaration
// happened even though it didn't end the game (a correct declaration is already obvious from
// the resulting phase change / game-over screen, so only misses need a log entry).
export interface DeclareLogEntry {
  type: 'DECLARE';
  declarerRole: PlayerRole;
  guess: Tile[];
}

export type HistoryEntry = QuestionLogEntry | DeclareLogEntry;

export function historyEntryRole(entry: HistoryEntry): PlayerRole {
  return entry.type === 'QUESTION' ? entry.askerRole : entry.declarerRole;
}

export type GameResult =
  | { type: 'WIN'; winner: PlayerRole; reason: 'DECLARE_CORRECT' | 'SECOND_CHANCE_FAILED' | 'TIMEOUT' }
  | { type: 'DRAW'; reason: 'BOTH_CORRECT' | 'DECK_EXHAUSTED' };

// How long a player has to act (ask or declare) on their turn before they lose by timeout.
export const TURN_TIME_LIMIT_MS = 3 * 60 * 1000;

export interface GameState {
  phase: Phase;
  players: Record<PlayerRole, PlayerState>;
  currentTurn: PlayerRole;
  questionDeck: QuestionDeckState;
  history: HistoryEntry[];
  result?: GameResult;
  // When the current turn (or, during AWAITING_SECOND_CHANCE, SECOND's final declaration) started.
  // Whoever is "on the clock" loses by timeout if they don't act within TURN_TIME_LIMIT_MS.
  turnStartedAt: number;
}

export function createGame(
  firstPlayer: { id: string; name: string },
  secondPlayer: { id: string; name: string },
  rng: () => number = Math.random,
  now: () => number = Date.now
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
    turnStartedAt: now(),
  };
}

function otherRole(role: PlayerRole): PlayerRole {
  return role === 'FIRST' ? 'SECOND' : 'FIRST';
}

export function askQuestion(
  state: GameState,
  role: PlayerRole,
  cardId: QuestionCardId,
  subChoice?: number,
  now: () => number = Date.now
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

  const historyEntry: QuestionLogEntry = { type: 'QUESTION', cardId, subChoice, askerRole: role, answer };

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
    turnStartedAt: now(),
  };
}

export function declare(
  state: GameState,
  role: PlayerRole,
  guess: readonly Tile[],
  now: () => number = Date.now
): GameState {
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
      history: correct
        ? state.history
        : [...state.history, { type: 'DECLARE', declarerRole: role, guess: [...guess] }],
      result: correct
        ? { type: 'DRAW', reason: 'BOTH_CORRECT' }
        : { type: 'WIN', winner: 'FIRST', reason: 'SECOND_CHANCE_FAILED' },
    };
  }

  if (state.currentTurn !== role) throw new Error('Not your turn');
  const target = otherRole(role);
  const correct = checkDeclaration(guess, state.players[target].hand);

  if (!correct) {
    return {
      ...state,
      currentTurn: target,
      history: [...state.history, { type: 'DECLARE', declarerRole: role, guess: [...guess] }],
      turnStartedAt: now(),
    };
  }

  if (role === 'FIRST') {
    return { ...state, phase: 'AWAITING_SECOND_CHANCE', currentTurn: 'SECOND', turnStartedAt: now() };
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

// Ends the game because `role` failed to act (ask/declare) within TURN_TIME_LIMIT_MS.
// `role` must be whoever is currently "on the clock": the active turn during IN_PROGRESS,
// or SECOND during their one-shot final declaration window.
export function handleTimeout(state: GameState, role: PlayerRole): GameState {
  if (state.phase === 'IN_PROGRESS') {
    if (state.currentTurn !== role) throw new Error('It is not this player\'s turn to time out');
    return { ...state, phase: 'FINISHED', result: { type: 'WIN', winner: otherRole(role), reason: 'TIMEOUT' } };
  }
  if (state.phase === 'AWAITING_SECOND_CHANCE') {
    if (role !== 'SECOND') throw new Error("Only the second player's final declaration can time out");
    return { ...state, phase: 'FINISHED', result: { type: 'WIN', winner: 'FIRST', reason: 'TIMEOUT' } };
  }
  throw new Error('No active turn to time out');
}
