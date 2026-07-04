'use client';

import type { LobbyView } from '@server/socket/types/socketEvents';

export function WaitingRoom({ view }: { view: LobbyView }) {
  return (
    <div className="panel">
      <div className="panel-title">対戦相手を待っています…</div>
      <p>友人にこの部屋コードを伝えてください。友人はトップページから「部屋に参加する」で入力します。</p>
      <div className="room-code">{view.roomId}</div>
      <p>ようこそ、{view.yourName} さん。</p>
    </div>
  );
}
