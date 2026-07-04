'use client';

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';

export function SpectateForm() {
  const { spectateRoom, connected } = useGameState();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && roomId.trim()) spectateRoom(roomId.trim().toUpperCase(), name.trim());
      }}
    >
      <div className="panel-title">観戦する</div>
      <p className="hint-text">対局が始まっている部屋を、手札を見ずに観戦できます。</p>
      <div className="form-row">
        <label htmlFor="spectate-name">あなたの名前</label>
        <input
          id="spectate-name"
          className="text-input"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: ぎゃらりー"
        />
      </div>
      <div className="form-row">
        <label htmlFor="spectate-room-id">部屋コード</label>
        <input
          id="spectate-room-id"
          className="text-input"
          value={roomId}
          maxLength={6}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="例: AB3C9K"
        />
      </div>
      <button type="submit" className="btn" disabled={!connected || !name.trim() || !roomId.trim()}>
        観戦する
      </button>
    </form>
  );
}
