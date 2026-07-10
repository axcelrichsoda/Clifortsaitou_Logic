import type { HistoryEntry, PlayerRole } from '@/engine/gameState';
import { historyEntryRole } from '@/engine/gameState';
import { describeQuestion, formatAnswerValue } from '@/lib/formatAnswer';

function renderEntry(entry: HistoryEntry, key: number, askerLabel: string, targetLabel: string) {
  if (entry.type === 'DECLARE') {
    return (
      <div className="question-log-entry question-log-entry-declare" key={key}>
        <div>{askerLabel}が宣言しましたが外れました</div>
      </div>
    );
  }
  return (
    <div className="question-log-entry" key={key}>
      <div>{describeQuestion(entry)}</div>
      <div>{formatAnswerValue(entry.answer, askerLabel, targetLabel)}</div>
    </div>
  );
}

export function QuestionLog({
  history,
  yourRole,
  yourName,
  opponentName,
}: {
  history: HistoryEntry[];
  yourRole: PlayerRole;
  yourName: string;
  opponentName: string;
}) {
  const yourEntries = [...history].reverse().filter((e) => historyEntryRole(e) === yourRole);
  const opponentEntries = [...history].reverse().filter((e) => historyEntryRole(e) !== yourRole);

  return (
    <div>
      <div className="panel-title">質問履歴</div>
      <div className="question-log-columns">
        <div className="question-log-column">
          <div className="question-log-column-title">{yourName}(あなた)の質問</div>
          <div className="question-log">
            {yourEntries.length === 0 && <p className="hint-text">まだ質問していません。</p>}
            {yourEntries.map((entry, i) => renderEntry(entry, i, 'あなた', '相手'))}
          </div>
        </div>
        <div className="question-log-column">
          <div className="question-log-column-title">{opponentName}の質問</div>
          <div className="question-log">
            {opponentEntries.length === 0 && <p className="hint-text">まだ質問がありません。</p>}
            {opponentEntries.map((entry, i) => renderEntry(entry, i, '相手', 'あなた'))}
          </div>
        </div>
      </div>
    </div>
  );
}
