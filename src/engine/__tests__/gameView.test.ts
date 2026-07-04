import { describe, expect, it } from 'vitest';
import { createGame, declare } from '../gameState';
import { toPlayerView, toSpectatorView } from '../gameView';

describe('toPlayerView', () => {
  it('never includes the opponent hand while the game is in progress', () => {
    const game = createGame({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, () => 0.3);
    const firstView = toPlayerView(game, 'FIRST');
    const secondView = toPlayerView(game, 'SECOND');
    expect(firstView.opponentHand).toBeUndefined();
    expect(secondView.opponentHand).toBeUndefined();
    expect(firstView.yourHand).toEqual(game.players.FIRST.hand);
    expect(secondView.yourHand).toEqual(game.players.SECOND.hand);
  });

  it('reveals both hands only once the game has finished', () => {
    let game = createGame({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, () => 0.3);
    game = declare(game, 'FIRST', game.players.SECOND.hand); // correct guess -> AWAITING_SECOND_CHANCE
    expect(toPlayerView(game, 'SECOND').opponentHand).toBeUndefined();
    game = declare(game, 'SECOND', game.players.FIRST.hand); // correct -> FINISHED / DRAW
    expect(game.phase).toBe('FINISHED');
    expect(toPlayerView(game, 'FIRST').opponentHand).toEqual(game.players.SECOND.hand);
    expect(toPlayerView(game, 'SECOND').opponentHand).toEqual(game.players.FIRST.hand);
  });
});

describe('toSpectatorView', () => {
  it('hides both hands while the game is in progress', () => {
    const game = createGame({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, () => 0.3);
    const view = toSpectatorView(game);
    expect(view.firstHand).toBeUndefined();
    expect(view.secondHand).toBeUndefined();
    expect(view.firstName).toBe('Alice');
    expect(view.secondName).toBe('Bob');
  });

  it('reveals both hands once the game has finished', () => {
    let game = createGame({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }, () => 0.3);
    game = declare(game, 'FIRST', game.players.SECOND.hand);
    game = declare(game, 'SECOND', game.players.FIRST.hand);
    expect(game.phase).toBe('FINISHED');
    const view = toSpectatorView(game);
    expect(view.firstHand).toEqual(game.players.FIRST.hand);
    expect(view.secondHand).toEqual(game.players.SECOND.hand);
  });
});
