import type { SpectatorView } from '@/engine/gameView';
import { Tile } from './Tile';

function resultText(view: SpectatorView): string {
  if (!view.result) return '';
  if (view.result.type === 'DRAW') {
    return view.result.reason === 'BOTH_CORRECT'
      ? '両者の宣言が的中し、引き分けです。'
      : '質問カードが尽きたため、引き分けです。';
  }
  const winnerName = view.result.winner === 'FIRST' ? view.firstName : view.secondName;
  const prefix = view.result.reason === 'TIMEOUT' ? '持ち時間切れのため、' : '';
  return `${prefix}${winnerName} の勝利です。`;
}

export function SpectatorGameOverScreen({ view, onBackToLobby }: { view: SpectatorView; onBackToLobby: () => void }) {
  return (
    <div className="page-container">
      <div className="game-over-screen">
        <div className="game-over-result">{resultText(view)}</div>
        <div className="reveal-hands">
          <div>
            <h3>{view.firstName} の手札</h3>
            <div className="hand-display">
              {(view.firstHand ?? []).map((t, i) => (
                <Tile key={i} tile={t} />
              ))}
            </div>
          </div>
          <div>
            <h3>{view.secondName} の手札</h3>
            <div className="hand-display">
              {(view.secondHand ?? []).map((t, i) => (
                <Tile key={i} tile={t} />
              ))}
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onBackToLobby}>
          トップに戻る
        </button>
      </div>
    </div>
  );
}
