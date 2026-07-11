import { describe, expect, it } from 'vitest';
import { askPracticeQuestion, createPracticeState, declarePractice, type PracticeState } from '../practice';
import { QUESTION_CARDS, type QuestionCardId } from '../questionCards';

function newPractice(seed = 1): PracticeState {
  let s = seed;
  const rng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return createPracticeState(rng);
}

function askAnyOpenCard(state: PracticeState): PracticeState {
  const cardId = state.questionDeck.open[0] as QuestionCardId;
  const def = QUESTION_CARDS[cardId];
  const subChoice = def.category === 'CHOICE' ? def.choices?.[0] : undefined;
  return askPracticeQuestion(state, cardId, subChoice);
}

describe('createPracticeState', () => {
  it('deals a 5-tile hand for both the player and the hidden target, with a fresh 21-card deck', () => {
    const state = newPractice();
    expect(state.yourHand).toHaveLength(5);
    expect(state.targetHand).toHaveLength(5);
    expect(state.questionDeck.open).toHaveLength(6);
    expect(state.won).toBe(false);
    expect(state.deckExhausted).toBe(false);
  });
});

describe('askPracticeQuestion', () => {
  it('resolves against the target hand and records history without any turn concept', () => {
    const state = newPractice();
    const next = askAnyOpenCard(state);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].type).toBe('QUESTION');
  });

  it('can be asked repeatedly with no turn restriction', () => {
    let state = newPractice();
    state = askAnyOpenCard(state);
    state = askAnyOpenCard(state);
    expect(state.history).toHaveLength(2);
  });

  it('rejects a card that is not open', () => {
    const state = newPractice();
    const closedCard = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as QuestionCardId[]).find(
      (id) => !state.questionDeck.open.includes(id)
    )!;
    expect(() => askPracticeQuestion(state, closedCard)).toThrow();
  });

  it('marks the deck exhausted once all 21 cards have been used, and blocks further questions', () => {
    let state = newPractice();
    while (!state.deckExhausted) {
      state = askAnyOpenCard(state);
    }
    expect(state.history).toHaveLength(21);
    expect(() => askAnyOpenCard(state)).toThrow();
  });
});

describe('declarePractice', () => {
  it('marks the round won on a correct declaration', () => {
    const state = newPractice();
    const next = declarePractice(state, state.targetHand);
    expect(next.won).toBe(true);
    expect(next.history[0]).toMatchObject({ type: 'DECLARE', correct: true });
  });

  it('does not end the round on an incorrect declaration, so the player can keep trying', () => {
    const state = newPractice();
    const wrongGuess = state.targetHand.map((t, i) =>
      i === 0 ? { number: (t.number + 1) % 10 === 5 ? 6 : (t.number + 1) % 10, color: t.color } : t
    );
    const next = declarePractice(state, wrongGuess);
    expect(next.won).toBe(false);
    expect(next.history[0]).toMatchObject({ type: 'DECLARE', correct: false });
    // still declarable again afterwards
    expect(() => declarePractice(next, next.targetHand)).not.toThrow();
  });

  it('allows declaring even after the question deck is exhausted', () => {
    let state = newPractice();
    while (!state.deckExhausted) {
      state = askAnyOpenCard(state);
    }
    expect(() => declarePractice(state, state.targetHand)).not.toThrow();
  });

  it('rejects declaring again once the round is already won', () => {
    let state = newPractice();
    state = declarePractice(state, state.targetHand);
    expect(() => declarePractice(state, state.targetHand)).toThrow();
  });

  it('rejects a structurally invalid guess', () => {
    const state = newPractice();
    expect(() => declarePractice(state, state.targetHand.slice(0, 4))).toThrow();
  });
});
