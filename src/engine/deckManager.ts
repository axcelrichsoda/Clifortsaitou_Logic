import type { QuestionCardId } from './questionCards';
import { ALL_QUESTION_CARD_IDS } from './questionCards';
import { shuffle } from './tiles';

export interface QuestionDeckState {
  open: QuestionCardId[]; // up to 6, the cards players may currently choose from
  drawPile: QuestionCardId[];
  discardPile: QuestionCardId[];
}

export function initQuestionDeck(rng: () => number = Math.random): QuestionDeckState {
  const shuffled = shuffle(ALL_QUESTION_CARD_IDS, rng);
  return {
    open: shuffled.slice(0, 6),
    drawPile: shuffled.slice(6),
    discardPile: [],
  };
}

export interface UseCardResult {
  deck: QuestionDeckState;
  exhausted: boolean; // true once no question cards remain anywhere (open + draw pile both empty)
}

// Named to avoid a leading "use" (eslint's react-hooks plugin treats any "use*" function as a hook).
export function consumeQuestionCard(deck: QuestionDeckState, cardId: QuestionCardId): UseCardResult {
  if (!deck.open.includes(cardId)) {
    throw new Error(`Card ${cardId} is not currently open`);
  }
  const remainingOpen = deck.open.filter((id) => id !== cardId);
  const discardPile = [...deck.discardPile, cardId];

  let open = remainingOpen;
  let drawPile = deck.drawPile;
  if (drawPile.length > 0) {
    const [drawn, ...rest] = drawPile;
    open = [...remainingOpen, drawn];
    drawPile = rest;
  }

  const exhausted = open.length === 0 && drawPile.length === 0;
  return { deck: { open, drawPile, discardPile }, exhausted };
}
