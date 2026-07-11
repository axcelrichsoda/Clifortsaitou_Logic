'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import type { Color } from '@/engine/types';
import type { QuestionCardId } from '@/engine/questionCards';
import {
  askPracticeQuestion,
  createPracticeState,
  declarePractice,
  type PracticeHistoryEntry,
  type PracticeState,
} from '@/engine/practice';
import { describeQuestion, formatAnswerValue, formatGuess } from '@/lib/formatAnswer';
import { HandDisplay } from './HandDisplay';
import { QuestionBoard } from './QuestionBoard';
import { Tile } from './Tile';
import { TileGuessBoard } from './TileGuessBoard';

function renderEntry(entry: PracticeHistoryEntry, key: number) {
  if (entry.type === 'DECLARE') {
    return (
      <div
        className={`question-log-entry ${entry.correct ? 'question-log-entry-correct' : 'question-log-entry-declare'}`}
        key={key}
      >
        <div>
          {formatGuess(entry.guess)} で宣言{entry.correct ? 'し、的中しました!' : 'しましたが、外れました。'}
        </div>
      </div>
    );
  }
  return (
    <div className="question-log-entry" key={key}>
      <div>{describeQuestion(entry)}</div>
      <div>{formatAnswerValue(entry.answer, 'あなた', '相手')}</div>
    </div>
  );
}

export function PracticeBoard() {
  // Deliberately start as null (not a randomly-dealt hand) so the server-rendered HTML and the
  // client's first render match exactly; the actual random deal only happens client-side after
  // mount. Computing Math.random()-based state during the initial render would differ between
  // server and client and trigger a React hydration mismatch, which silently breaks event
  // handlers in the affected subtree.
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [state, setState] = useState<PracticeState | null>(null);

  const resetRound = useCallback(() => {
    setRoomKey(nanoid());
    setState(createPracticeState());
  }, []);

  useEffect(() => {
    // Deliberate one-time client-only initialization (see the comment on the state above),
    // not a synchronization effect, so this doesn't fit the "don't setState in an effect" rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetRound();
  }, [resetRound]);

  const handleAsk = useCallback((cardId: number, subChoice?: number) => {
    setState((prev) => {
      if (!prev) return prev;
      try {
        return askPracticeQuestion(prev, cardId as QuestionCardId, subChoice);
      } catch {
        return prev;
      }
    });
  }, []);

  const handleDeclare = useCallback((guess: { number: number; color: Color }[]) => {
    setState((prev) => {
      if (!prev) return prev;
      try {
        return declarePractice(prev, guess);
      } catch {
        return prev;
      }
    });
  }, []);

  if (!state || !roomKey) {
    return (
      <div className="page-container">
        <p>読み込み中…</p>
      </div>
    );
  }

  const canAsk = !state.won && !state.deckExhausted;

  return (
    <div className="page-container">
      <h1 className="page-title">一人用練習モード</h1>
      <p className="hint-text">
        質問カードで手札を推理し、宣言して当たるか試す一人用の練習です。相手・ターン・持ち時間はありません。何度でもやり直せます。
      </p>

      {state.won && (
        <div className="second-chance-banner">
          <strong>正解です!おめでとうございます。</strong>
          <button className="btn btn-primary" onClick={resetRound}>
            もう一度練習する
          </button>
        </div>
      )}
      {!state.won && state.deckExhausted && (
        <div className="declare-miss-banner">質問カードを使い切りました。ここまでの情報で宣言してみましょう。</div>
      )}

      <div className="hands-row">
        <HandDisplay hand={state.yourHand} title="あなたの手札(練習用)" />
        <div className="panel">
          <div className="panel-title">相手の手札を推理する</div>
          {state.won ? (
            <div className="declare-slots">
              {state.targetHand.map((t, i) => (
                <Tile key={i} tile={t} />
              ))}
            </div>
          ) : (
            <TileGuessBoard key={roomKey} roomId={roomKey} yourRole="FIRST" onDeclare={handleDeclare} canSubmit />
          )}
        </div>
      </div>

      <div className="panel">
        <span className="deck-status">
          山札残り {state.questionDeck.drawPile.length} 枚 / 捨て札 {state.questionDeck.discardPile.length} 枚
        </span>
        <QuestionBoard openCards={state.questionDeck.open} isMyTurn={canAsk} onAsk={handleAsk} />
      </div>

      <div className="panel">
        <div className="panel-title">質問・宣言の履歴</div>
        <div className="question-log">
          {state.history.length === 0 && <p className="hint-text">まだ質問していません。</p>}
          {[...state.history].reverse().map((entry, i) => renderEntry(entry, i))}
        </div>
      </div>

      <div className="choice-options">
        <button className="btn" onClick={resetRound}>
          新しい手札でやり直す
        </button>
        <Link href="/" className="btn">
          トップに戻る
        </Link>
      </div>
    </div>
  );
}
