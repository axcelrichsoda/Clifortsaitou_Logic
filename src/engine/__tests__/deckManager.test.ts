import { describe, expect, it } from 'vitest';
import { initQuestionDeck, consumeQuestionCard } from '../deckManager';
import { ALL_QUESTION_CARD_IDS } from '../questionCards';

describe('initQuestionDeck', () => {
  it('deals 6 open cards and 15 in the draw pile, covering all 21 cards exactly once', () => {
    const deck = initQuestionDeck(() => 0.5);
    expect(deck.open).toHaveLength(6);
    expect(deck.drawPile).toHaveLength(15);
    expect(deck.discardPile).toHaveLength(0);
    expect([...deck.open, ...deck.drawPile].sort((a, b) => a - b)).toEqual(ALL_QUESTION_CARD_IDS);
  });
});

describe('consumeQuestionCard', () => {
  it('discards the used card and refills open from the draw pile', () => {
    const deck = initQuestionDeck(() => 0.5);
    const usedCard = deck.open[0];
    const { deck: next, exhausted } = consumeQuestionCard(deck, usedCard);
    expect(exhausted).toBe(false);
    expect(next.open).toHaveLength(6);
    expect(next.open).not.toContain(usedCard);
    expect(next.discardPile).toEqual([usedCard]);
    expect(next.drawPile).toHaveLength(14);
  });

  it('throws if the card is not currently open', () => {
    const deck = initQuestionDeck(() => 0.5);
    const notOpen = ALL_QUESTION_CARD_IDS.find((id) => !deck.open.includes(id))!;
    expect(() => consumeQuestionCard(deck, notOpen)).toThrow();
  });

  it('reports exhausted once both the open cards and draw pile run out', () => {
    let deck = initQuestionDeck(() => 0.5);
    let exhausted = false;
    // Use all 21 cards one by one; open keeps refilling until the draw pile runs dry,
    // then open itself shrinks to 0.
    for (let i = 0; i < 21; i++) {
      const card = deck.open[0];
      const result = consumeQuestionCard(deck, card);
      deck = result.deck;
      exhausted = result.exhausted;
    }
    expect(deck.open).toHaveLength(0);
    expect(deck.drawPile).toHaveLength(0);
    expect(deck.discardPile).toHaveLength(21);
    expect(exhausted).toBe(true);
  });
});
