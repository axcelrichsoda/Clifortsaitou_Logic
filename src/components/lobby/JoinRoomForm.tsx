'use client';

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';

export function JoinRoomForm() {
  const { joinRoom, connected } = useGameState();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && roomId.trim()) joinRoom(roomId.trim().toUpperCase(), name.trim());
      }}
    >
      <div className="panel-title">部屋に参加する</div>
      <div className="form-row">
        <label htmlFor="join-name">あなたの名前</label>
        <input
          id="join-name"
          className="text-input"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: はなこ"
        />
      </div>
      <div className="form-row">
        <label htmlFor="join-room-id">部屋コード</label>
        <input
          id="join-room-id"
          className="text-input"
          value={roomId}
          maxLength={6}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="例: AB3C9K"
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={!connected || !name.trim() || !roomId.trim()}>
        参加する
      </button>
    </form>
  );
}
