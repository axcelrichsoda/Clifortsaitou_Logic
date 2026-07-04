import type { PlayerRole, QuestionLogEntry } from '@/engine/gameState';
import { describeQuestion, formatAnswerValue } from '@/lib/formatAnswer';

function renderEntry(entry: QuestionLogEntry, key: number, askerLabel: string, targetLabel: string) {
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
  history: QuestionLogEntry[];
  yourRole: PlayerRole;
  yourName: string;
  opponentName: string;
}) {
  const yourEntries = [...history].reverse().filter((e) => e.askerRole === yourRole);
  const opponentEntries = [...history].reverse().filter((e) => e.askerRole !== yourRole);

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
