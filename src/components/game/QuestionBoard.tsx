'use client';

import { useState } from 'react';
import { QUESTION_CARDS, type QuestionCardId } from '@/engine/questionCards';
import { QuestionSubOptionModal } from './QuestionSubOptionModal';

const CATEGORY_LABEL: Record<string, string> = {
  SHARED: '共有情報',
  CHOICE: '選択式',
  NORMAL: '通常',
};

export function QuestionBoard({
  openCards,
  isMyTurn,
  onAsk,
}: {
  openCards: QuestionCardId[];
  isMyTurn: boolean;
  onAsk: (cardId: number, subChoice?: number) => void;
}) {
  const [pendingChoiceCard, setPendingChoiceCard] = useState<QuestionCardId | null>(null);

  return (
    <div>
      <div className="panel-title">質問カード(オープン{openCards.length}枚)</div>
      <div className="question-board">
        {openCards.map((cardId) => {
          const def = QUESTION_CARDS[cardId];
          return (
            <div
              key={cardId}
              className={`question-card ${isMyTurn ? 'selectable' : 'disabled'}`}
              onClick={() => {
                if (!isMyTurn) return;
                if (def.category === 'CHOICE') {
                  setPendingChoiceCard(cardId);
                } else {
                  onAsk(cardId);
                }
              }}
            >
              <span className="category-tag">{CATEGORY_LABEL[def.category]}</span>
              <div>{def.label}</div>
            </div>
          );
        })}
      </div>
      {pendingChoiceCard !== null && (
        <QuestionSubOptionModal
          cardId={pendingChoiceCard}
          onChoose={(choice) => {
            onAsk(pendingChoiceCard, choice);
            setPendingChoiceCard(null);
          }}
          onCancel={() => setPendingChoiceCard(null)}
        />
      )}
    </div>
  );
}
