'use client';

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';

export function CreateRoomForm() {
  const { createRoom, connected } = useGameState();
  const [name, setName] = useState('');

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) createRoom(name.trim());
      }}
    >
      <div className="panel-title">部屋を作る</div>
      <div className="form-row">
        <label htmlFor="create-name">あなたの名前</label>
        <input
          id="create-name"
          className="text-input"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: たろう"
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={!connected || !name.trim()}>
        部屋を作る
      </button>
    </form>
  );
}
