'use client';

import { useMemo, useState } from 'react';
import type { PlayerRole } from '@/engine/gameState';
import type { Color } from '@/engine/types';
import { isValidGuessSet } from '@/engine/declaration';
import { Tile } from './Tile';
import { MemoGrid } from './MemoGrid';

interface Slot {
  number: number;
  color: Color | null; // null = color not yet determined ("不明")
}

function defaultSlots(): Slot[] {
  return Array.from({ length: 5 }, () => ({ number: 0, color: null as Color | null }));
}

export function TileGuessBoard({
  roomId,
  yourRole,
  onDeclare,
  submitLabel = '宣言する',
  canSubmit,
  disabledHint,
}: {
  roomId: string;
  yourRole: PlayerRole;
  onDeclare: (guess: { number: number; color: Color }[]) => void;
  submitLabel?: string;
  canSubmit: boolean;
  disabledHint?: string;
}) {
  const [slots, setSlots] = useState<Slot[]>(defaultSlots);
  const [confirming, setConfirming] = useState(false);

  const allColorsKnown = slots.every((s) => s.color !== null);
  const valid = useMemo(
    () => allColorsKnown && isValidGuessSet(slots as { number: number; color: Color }[]),
    [slots, allColorsKnown]
  );

  function cycleNumber(index: number) {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const nextNumber = (s.number + 1) % 10;
        // Leaving/entering 5 forces YELLOW; otherwise a color choice already made is kept,
        // but crossing through 5 clears it back to "不明" since it no longer applies.
        const color: Color | null = nextNumber === 5 ? 'YELLOW' : s.color === 'YELLOW' ? null : s.color;
        return { number: nextNumber, color };
      })
    );
  }

  function setColor(index: number, color: Color | null) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, color } : s)));
  }

  if (confirming) {
    const confirmedSlots = slots as { number: number; color: Color }[];
    return (
      <div className="tile-guess-board">
        <p>この内容で宣言します。数字・色が1つでも違うと不正解になります。よろしいですか？</p>
        <div className="declare-slots">
          {confirmedSlots.map((slot, i) => (
            <Tile key={i} tile={slot} />
          ))}
        </div>
        <div className="choice-options">
          <button className="btn btn-danger" onClick={() => onDeclare(confirmedSlots)}>
            {submitLabel}
          </button>
          <button className="btn" onClick={() => setConfirming(false)}>
            修正する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tile-guess-board">
      <MemoGrid roomId={roomId} yourRole={yourRole} />

      <div className="declare-slots">
        {slots.map((slot, i) => (
          <div className="declare-slot" key={i}>
            <span className="position-label">位置{i + 1}</span>
            <button
              type="button"
              className={`tile ${slot.color ? `tile-${slot.color}` : 'tile-UNKNOWN'}`}
              onClick={() => cycleNumber(i)}
            >
              {slot.number}
            </button>
            {slot.number === 5 ? (
              <span className="color-tag">黄</span>
            ) : (
              <div className="color-tabs">
                <button
                  type="button"
                  className={`color-tab color-tab-RED ${slot.color === 'RED' ? 'active' : ''}`}
                  onClick={() => setColor(i, 'RED')}
                  aria-label="赤"
                  aria-pressed={slot.color === 'RED'}
                />
                <button
                  type="button"
                  className={`color-tab color-tab-BLUE ${slot.color === 'BLUE' ? 'active' : ''}`}
                  onClick={() => setColor(i, 'BLUE')}
                  aria-label="青"
                  aria-pressed={slot.color === 'BLUE'}
                />
                <button
                  type="button"
                  className={`color-tab color-tab-UNKNOWN ${slot.color === null ? 'active' : ''}`}
                  onClick={() => setColor(i, null)}
                  aria-label="色不明"
                  aria-pressed={slot.color === null}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-primary" disabled={!valid || !canSubmit} onClick={() => setConfirming(true)}>
        {submitLabel}
      </button>
      {!allColorsKnown && (
        <p className="hint-text">色が「不明」のマスがあります。宣言するには赤・青を確定してください。</p>
      )}
      {allColorsKnown && !valid && (
        <p className="hint-text">同じタイルを2回以上選ぶことはできません(5は黄色2枚まで可)。</p>
      )}
      {valid && !canSubmit && disabledHint && <p className="hint-text">{disabledHint}</p>}
    </div>
  );
}
