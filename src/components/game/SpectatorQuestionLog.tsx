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

export function SpectatorQuestionLog({
  history,
  firstName,
  secondName,
}: {
  history: QuestionLogEntry[];
  firstName: string;
  secondName: string;
}) {
  const nameOf = (role: PlayerRole) => (role === 'FIRST' ? firstName : secondName);
  const firstEntries = [...history].reverse().filter((e) => e.askerRole === 'FIRST');
  const secondEntries = [...history].reverse().filter((e) => e.askerRole === 'SECOND');

  return (
    <div>
      <div className="panel-title">質問履歴</div>
      <div className="question-log-columns">
        <div className="question-log-column">
          <div className="question-log-column-title">{firstName}(先攻)の質問</div>
          <div className="question-log">
            {firstEntries.length === 0 && <p className="hint-text">まだ質問がありません。</p>}
            {firstEntries.map((entry, i) => renderEntry(entry, i, nameOf(entry.askerRole), secondName))}
          </div>
        </div>
        <div className="question-log-column">
          <div className="question-log-column-title">{secondName}(後攻)の質問</div>
          <div className="question-log">
            {secondEntries.length === 0 && <p className="hint-text">まだ質問がありません。</p>}
            {secondEntries.map((entry, i) => renderEntry(entry, i, nameOf(entry.askerRole), firstName))}
          </div>
        </div>
      </div>
    </div>
  );
}
