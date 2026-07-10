'use client';

import type { PlayerRole } from '@/engine/gameState';
import type { Color } from '@/engine/types';
import { TileGuessBoard } from './TileGuessBoard';

export function SecondChanceBanner({
  yourRole,
  roomId,
  opponentName,
  onDeclare,
  onForfeit,
}: {
  yourRole: PlayerRole;
  roomId: string;
  opponentName: string;
  onDeclare: (guess: { number: number; color: Color }[]) => void;
  onForfeit: () => void;
}) {
  if (yourRole === 'FIRST') {
    return (
      <div className="second-chance-banner">
        <strong>あなたの宣言は的中しました!</strong>
        <p>{opponentName} が最終宣言に挑戦中です。結果をお待ちください。</p>
      </div>
    );
  }

  return (
    <div className="second-chance-banner">
      <strong>相手の宣言が的中しました。あなたに最終宣言のチャンスがあります!</strong>
      <p>ここで正解すれば引き分け、外すか放棄すると相手の勝利になります。</p>
      <TileGuessBoard roomId={roomId} yourRole={yourRole} onDeclare={onDeclare} submitLabel="最終宣言する" canSubmit />
      <button className="btn btn-danger" onClick={onForfeit}>
        最終宣言を放棄する
      </button>
    </div>
  );
}
