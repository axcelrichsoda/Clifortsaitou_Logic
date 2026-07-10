import type { Hand } from './types';
import type { GameState, GameResult, Phase, PlayerRole, HistoryEntry } from './gameState';
import type { QuestionCardId } from './questionCards';

// The server-authoritative view sent to one specific player: it must never include the
// opponent's hand except after the game has finished (phase === 'FINISHED').
export interface GameStateView {
  phase: Phase;
  yourRole: PlayerRole;
  yourName: string;
  yourHand: Hand;
  opponentName: string;
  opponentConnected: boolean;
  currentTurn: PlayerRole;
  openCards: QuestionCardId[];
  drawPileCount: number;
  discardPileCount: number;
  history: HistoryEntry[];
  result?: GameResult;
  opponentHand?: Hand;
}

function otherRole(role: PlayerRole): PlayerRole {
  return role === 'FIRST' ? 'SECOND' : 'FIRST';
}

export function toPlayerView(game: GameState, viewerRole: PlayerRole): GameStateView {
  const opponentRole = otherRole(viewerRole);
  const you = game.players[viewerRole];
  const opponent = game.players[opponentRole];
  return {
    phase: game.phase,
    yourRole: viewerRole,
    yourName: you.name,
    yourHand: you.hand,
    opponentName: opponent.name,
    opponentConnected: opponent.connected,
    currentTurn: game.currentTurn,
    openCards: game.questionDeck.open,
    drawPileCount: game.questionDeck.drawPile.length,
    discardPileCount: game.questionDeck.discardPile.length,
    history: game.history,
    result: game.result,
    opponentHand: game.phase === 'FINISHED' ? opponent.hand : undefined,
  };
}

// The view sent to spectators: same restrictions as a player (neither hand is visible until
// the game finishes), but with no "yours vs opponent" framing since a spectator isn't playing.
export interface SpectatorView {
  phase: Phase;
  firstName: string;
  secondName: string;
  firstConnected: boolean;
  secondConnected: boolean;
  currentTurn: PlayerRole;
  openCards: QuestionCardId[];
  drawPileCount: number;
  discardPileCount: number;
  history: HistoryEntry[];
  result?: GameResult;
  firstHand?: Hand;
  secondHand?: Hand;
}

export function toSpectatorView(game: GameState): SpectatorView {
  const finished = game.phase === 'FINISHED';
  return {
    phase: game.phase,
    firstName: game.players.FIRST.name,
    secondName: game.players.SECOND.name,
    firstConnected: game.players.FIRST.connected,
    secondConnected: game.players.SECOND.connected,
    currentTurn: game.currentTurn,
    openCards: game.questionDeck.open,
    drawPileCount: game.questionDeck.drawPile.length,
    discardPileCount: game.questionDeck.discardPile.length,
    history: game.history,
    result: game.result,
    firstHand: finished ? game.players.FIRST.hand : undefined,
    secondHand: finished ? game.players.SECOND.hand : undefined,
  };
}
