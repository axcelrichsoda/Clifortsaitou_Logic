'use client';

import { QUESTION_CARDS, type QuestionCardId } from '@/engine/questionCards';

export function QuestionSubOptionModal({
  cardId,
  onChoose,
  onCancel,
}: {
  cardId: QuestionCardId;
  onChoose: (choice: number) => void;
  onCancel: () => void;
}) {
  const def = QUESTION_CARDS[cardId];
  if (!def.choices) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="panel-title">{def.label}</div>
        <p>どちらの数字について質問しますか？</p>
        <div className="choice-options">
          {def.choices.map((choice) => (
            <button key={choice} className="btn btn-primary" onClick={() => onChoose(choice)}>
              {choice}
            </button>
          ))}
        </div>
        <button className="btn" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
