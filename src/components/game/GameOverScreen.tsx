import type { GameStateView } from '@/engine/gameView';
import { Tile } from './Tile';

function resultText(view: GameStateView): string {
  if (!view.result) return '';
  if (view.result.type === 'DRAW') {
    return view.result.reason === 'BOTH_CORRECT'
      ? '両者の宣言が的中し、引き分けです。'
      : '質問カードが尽きたため、引き分けです。';
  }
  const youWon = view.result.winner === view.yourRole;
  return youWon ? 'あなたの勝利です!' : `${view.opponentName} の勝利です。`;
}

export function GameOverScreen({ view, onBackToLobby }: { view: GameStateView; onBackToLobby: () => void }) {
  return (
    <div className="page-container">
      <div className="game-over-screen">
        <div className="game-over-result">{resultText(view)}</div>
        <div className="reveal-hands">
          <div>
            <h3>あなたの手札</h3>
            <div className="hand-display">
              {view.yourHand.map((t, i) => (
                <Tile key={i} tile={t} />
              ))}
            </div>
          </div>
          <div>
            <h3>{view.opponentName} の手札</h3>
            <div className="hand-display">
              {(view.opponentHand ?? []).map((t, i) => (
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
