'use client';

import type { GameStateView } from '@/engine/gameView';
import type { Color } from '@/engine/types';
import { HandDisplay } from './HandDisplay';
import { QuestionBoard } from './QuestionBoard';
import { QuestionLog } from './QuestionLog';
import { RulesPanel } from './RulesPanel';
import { TileGuessBoard } from './TileGuessBoard';
import { TurnIndicator } from './TurnIndicator';
import { TurnTimer } from './TurnTimer';
import { SecondChanceBanner } from './SecondChanceBanner';

export function GameBoard({
  view,
  roomId,
  spectatorCount,
  onAskQuestion,
  onDeclare,
  onForfeitSecondChance,
}: {
  view: GameStateView;
  roomId: string;
  spectatorCount: number;
  onAskQuestion: (cardId: number, subChoice?: number) => void;
  onDeclare: (guess: { number: number; color: Color }[]) => void;
  onForfeitSecondChance: () => void;
}) {
  const isMyTurn = view.phase === 'IN_PROGRESS' && view.currentTurn === view.yourRole;
  const lastEntry = view.history[view.history.length - 1];

  return (
    <div className="page-container">
      <RulesPanel />
      <TurnIndicator isMyTurn={isMyTurn} phase={view.phase} yourRole={view.yourRole} />
      <TurnTimer turnStartedAt={view.turnStartedAt} />
      {spectatorCount > 0 && <p className="hint-text">観戦者: {spectatorCount}人</p>}
      {!view.opponentConnected && (
        <div className="error-banner">{view.opponentName} が切断中です。再接続をお待ちください。</div>
      )}
      {lastEntry?.type === 'DECLARE' && (
        <div className="declare-miss-banner">
          {lastEntry.declarerRole === view.yourRole ? 'あなたの宣言は違います。' : `${view.opponentName} の宣言は違います。`}
        </div>
      )}

      <div className="hands-row">
        <HandDisplay hand={view.yourHand} title={`あなたの手札 (${view.yourName})`} />
        {view.phase === 'IN_PROGRESS' && (
          <div className="panel">
            <div className="panel-title">{view.opponentName} の手札を予想する</div>
            <TileGuessBoard
              roomId={roomId}
              yourRole={view.yourRole}
              onDeclare={onDeclare}
              canSubmit={isMyTurn}
              disabledHint="相手の番です。あなたの番になったら宣言できます。"
            />
          </div>
        )}
      </div>

      <div className="panel">
        <span className="deck-status">
          山札残り {view.drawPileCount} 枚 / 捨て札 {view.discardPileCount} 枚
        </span>
        <QuestionBoard openCards={view.openCards} isMyTurn={isMyTurn} onAsk={onAskQuestion} />
      </div>

      <div className="panel">
        <QuestionLog
          history={view.history}
          yourRole={view.yourRole}
          yourName={view.yourName}
          opponentName={view.opponentName}
        />
      </div>

      {view.phase === 'AWAITING_SECOND_CHANCE' && (
        <SecondChanceBanner
          yourRole={view.yourRole}
          roomId={roomId}
          opponentName={view.opponentName}
          onDeclare={onDeclare}
          onForfeit={onForfeitSecondChance}
        />
      )}
    </div>
  );
}
