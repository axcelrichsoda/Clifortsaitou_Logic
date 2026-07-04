export function TurnIndicator({ isMyTurn, phase }: { isMyTurn: boolean; phase: string }) {
  if (phase === 'AWAITING_SECOND_CHANCE') return null;
  return (
    <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
      {isMyTurn ? 'あなたの番です' : '相手の番です'}
    </div>
  );
}
