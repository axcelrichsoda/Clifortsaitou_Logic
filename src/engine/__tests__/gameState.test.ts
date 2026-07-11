import { describe, expect, it } from 'vitest';
import { askQuestion, createGame, declare, forfeitSecondChance, handleTimeout, type GameState } from '../gameState';
import { QUESTION_CARDS, type QuestionCardId } from '../questionCards';

function newGame(seed = 1): GameState {
  let s = seed;
  const rng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return createGame({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, rng);
}

function askAnyOpenCard(state: GameState, role: 'FIRST' | 'SECOND'): GameState {
  const cardId = state.questionDeck.open[0] as QuestionCardId;
  const def = QUESTION_CARDS[cardId];
  const subChoice = def.category === 'CHOICE' ? def.choices?.[0] : undefined;
  return askQuestion(state, role, cardId, subChoice);
}

describe('createGame', () => {
  it('starts IN_PROGRESS with FIRST to move and 5-tile hands dealt', () => {
    const game = newGame();
    expect(game.phase).toBe('IN_PROGRESS');
    expect(game.currentTurn).toBe('FIRST');
    expect(game.players.FIRST.hand).toHaveLength(5);
    expect(game.players.SECOND.hand).toHaveLength(5);
  });
});

describe('asking questions', () => {
  it('resolves against the opponent hand and passes the turn', () => {
    const game = newGame();
    const next = askAnyOpenCard(game, 'FIRST');
    expect(next.currentTurn).toBe('SECOND');
    expect(next.history).toHaveLength(1);
    expect(next.history[0].askerRole).toBe('FIRST');
  });

  it('rejects asking out of turn', () => {
    const game = newGame();
    expect(() => askAnyOpenCard(game, 'SECOND')).toThrow();
  });

  it('rejects a card that is not open', () => {
    const game = newGame();
    const closedCard = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as QuestionCardId[]).find(
      (id) => !game.questionDeck.open.includes(id)
    )!;
    expect(() => askQuestion(game, 'FIRST', closedCard)).toThrow();
  });
});

describe('declaration outcomes', () => {
  it('normal win: SECOND declares correctly on their own turn', () => {
    let game = newGame();
    game = askAnyOpenCard(game, 'FIRST'); // pass turn to SECOND
    game = declare(game, 'SECOND', game.players.FIRST.hand);
    expect(game.phase).toBe('FINISHED');
    expect(game.result).toEqual({ type: 'WIN', winner: 'SECOND', reason: 'DECLARE_CORRECT' });
  });

  it('an incorrect declaration does not end the game, just passes the turn', () => {
    let game = newGame();
    const wrongGuess = game.players.SECOND.hand.map((t, i) =>
      i === 0 ? { number: (t.number + 1) % 10 === 5 ? 6 : (t.number + 1) % 10, color: t.color } : t
    );
    game = declare(game, 'FIRST', wrongGuess);
    expect(game.phase).toBe('IN_PROGRESS');
    expect(game.currentTurn).toBe('SECOND');
  });

  it('special case: FIRST declares correctly -> SECOND gets a final chance -> SECOND fails -> FIRST wins', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    expect(game.phase).toBe('AWAITING_SECOND_CHANCE');
    expect(game.currentTurn).toBe('SECOND');

    const wrongGuess = game.players.FIRST.hand.map((t, i) =>
      i === 0 ? { number: (t.number + 1) % 10 === 5 ? 6 : (t.number + 1) % 10, color: t.color } : t
    );
    game = declare(game, 'SECOND', wrongGuess);
    expect(game.phase).toBe('FINISHED');
    expect(game.result).toEqual({ type: 'WIN', winner: 'FIRST', reason: 'SECOND_CHANCE_FAILED' });
  });

  it('special case: FIRST declares correctly -> SECOND also declares correctly -> draw', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    game = declare(game, 'SECOND', game.players.FIRST.hand);
    expect(game.phase).toBe('FINISHED');
    expect(game.result).toEqual({ type: 'DRAW', reason: 'BOTH_CORRECT' });
  });

  it('special case: FIRST declares correctly -> SECOND forfeits -> FIRST wins', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    game = forfeitSecondChance(game, 'SECOND');
    expect(game.phase).toBe('FINISHED');
    expect(game.result).toEqual({ type: 'WIN', winner: 'FIRST', reason: 'SECOND_CHANCE_FAILED' });
  });

  it('rejects FIRST trying to declare during SECOND\'s final-chance window', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    expect(() => declare(game, 'FIRST', game.players.SECOND.hand)).toThrow();
  });

  it('rejects forfeiting when no second chance is pending', () => {
    const game = newGame();
    expect(() => forfeitSecondChance(game, 'SECOND')).toThrow();
  });

  it('rejects declaring out of turn', () => {
    const game = newGame();
    expect(() => declare(game, 'SECOND', game.players.FIRST.hand)).toThrow();
  });

  it('rejects a structurally invalid guess (wrong length)', () => {
    const game = newGame();
    expect(() => declare(game, 'FIRST', game.players.SECOND.hand.slice(0, 4))).toThrow();
  });
});

describe('turn timeout', () => {
  it('ends the game with the other player winning when the active turn player times out', () => {
    const game = newGame();
    const next = handleTimeout(game, 'FIRST');
    expect(next.phase).toBe('FINISHED');
    expect(next.result).toEqual({ type: 'WIN', winner: 'SECOND', reason: 'TIMEOUT' });
  });

  it('ends the game with FIRST winning when SECOND times out on the final declaration', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    expect(game.phase).toBe('AWAITING_SECOND_CHANCE');
    const next = handleTimeout(game, 'SECOND');
    expect(next.phase).toBe('FINISHED');
    expect(next.result).toEqual({ type: 'WIN', winner: 'FIRST', reason: 'TIMEOUT' });
  });

  it('rejects a timeout for a role that is not actually on the clock', () => {
    const game = newGame();
    expect(() => handleTimeout(game, 'SECOND')).toThrow();
  });

  it('rejects FIRST timing out during the final-declaration window (only SECOND is on the clock)', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    expect(() => handleTimeout(game, 'FIRST')).toThrow();
  });

  it('rejects timing out a finished game', () => {
    let game = newGame();
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    game = forfeitSecondChance(game, 'SECOND');
    expect(() => handleTimeout(game, 'FIRST')).toThrow();
  });

  it('resets turnStartedAt whenever the active turn changes', () => {
    let now = 1000;
    const clock = () => now;
    let game = createGame({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, Math.random, clock);
    expect(game.turnStartedAt).toBe(1000);

    now = 2000;
    const cardId = game.questionDeck.open[0] as QuestionCardId;
    const def = QUESTION_CARDS[cardId];
    const subChoice = def.category === 'CHOICE' ? def.choices?.[0] : undefined;
    game = askQuestion(game, 'FIRST', cardId, subChoice, clock);
    expect(game.turnStartedAt).toBe(2000);

    now = 3000;
    const wrongGuess = game.players.FIRST.hand.map((t, i) =>
      i === 0 ? { number: (t.number + 1) % 10 === 5 ? 6 : (t.number + 1) % 10, color: t.color } : t
    );
    game = declare(game, 'SECOND', wrongGuess, clock);
    expect(game.phase).toBe('IN_PROGRESS');
    expect(game.turnStartedAt).toBe(3000);

    now = 4000;
    game = declare(game, 'FIRST', game.players.SECOND.hand, clock);
    expect(game.phase).toBe('AWAITING_SECOND_CHANCE');
    expect(game.turnStartedAt).toBe(4000);
  });
});

describe('deck exhaustion', () => {
  it('ends in a draw once all 21 question cards have been used with no correct declaration', () => {
    let game = newGame();
    while (game.phase === 'IN_PROGRESS') {
      game = askAnyOpenCard(game, game.currentTurn);
    }
    expect(game.phase).toBe('FINISHED');
    expect(game.result).toEqual({ type: 'DRAW', reason: 'DECK_EXHAUSTED' });
    expect(game.history).toHaveLength(21);
  });
});
