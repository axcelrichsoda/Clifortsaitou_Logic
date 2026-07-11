import type { SpectatorView } from '@/engine/gameView';
import { QuestionBoard } from './QuestionBoard';
import { RulesPanel } from './RulesPanel';
import { SpectatorQuestionLog } from './SpectatorQuestionLog';
import { TurnTimer } from './TurnTimer';

function noop() {
  // Spectators can't ask questions; QuestionBoard just needs a handler to satisfy its props.
}

export function SpectatorBoard({ view }: { view: SpectatorView }) {
  const turnName = view.currentTurn === 'FIRST' ? view.firstName : view.secondName;
  const lastEntry = view.history[view.history.length - 1];

  return (
    <div className="page-container">
      <RulesPanel />
      <div className="turn-indicator">観戦中: {turnName} の番です</div>
      <TurnTimer turnStartedAt={view.turnStartedAt} />

      {!view.firstConnected && <div className="error-banner">{view.firstName} が切断中です。</div>}
      {!view.secondConnected && <div className="error-banner">{view.secondName} が切断中です。</div>}
      {lastEntry?.type === 'DECLARE' && (
        <div className="declare-miss-banner">
          {(lastEntry.declarerRole === 'FIRST' ? view.firstName : view.secondName)} の宣言は違います。
        </div>
      )}

      {view.phase === 'AWAITING_SECOND_CHANCE' && (
        <div className="second-chance-banner">
          <strong>{view.firstName} の宣言が的中しました!</strong>
          <p>{view.secondName} が最終宣言に挑戦中です。結果をお待ちください。</p>
        </div>
      )}

      <div className="panel">
        <span className="deck-status">
          山札残り {view.drawPileCount} 枚 / 捨て札 {view.discardPileCount} 枚
        </span>
        <QuestionBoard openCards={view.openCards} isMyTurn={false} onAsk={noop} />
      </div>

      <div className="panel">
        <SpectatorQuestionLog history={view.history} firstName={view.firstName} secondName={view.secondName} />
      </div>
    </div>
  );
}
