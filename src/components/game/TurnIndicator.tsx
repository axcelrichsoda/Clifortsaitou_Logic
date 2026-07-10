import type { PlayerRole } from '@/engine/gameState';

export function TurnIndicator({
  isMyTurn,
  phase,
  yourRole,
}: {
  isMyTurn: boolean;
  phase: string;
  yourRole: PlayerRole;
}) {
  if (phase === 'AWAITING_SECOND_CHANCE') {
    return yourRole === 'FIRST' ? (
      <div className="turn-indicator my-turn">あなたの宣言は的中しました!相手が最終宣言に挑戦中です</div>
    ) : (
      <div className="turn-indicator second-chance-urgent">
        相手の宣言が的中しました。あなたに最終宣言のチャンスがあります!
      </div>
    );
  }
  return (
    <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
      {isMyTurn ? 'あなたの番です' : '相手の番です'}
    </div>
  );
}
