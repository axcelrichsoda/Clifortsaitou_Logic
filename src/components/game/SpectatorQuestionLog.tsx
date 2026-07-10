import type { HistoryEntry, PlayerRole } from '@/engine/gameState';
import { historyEntryRole } from '@/engine/gameState';
import { QUESTION_CARDS } from '@/engine/questionCards';
import { describeQuestion, formatAnswerValue } from '@/lib/formatAnswer';

function isSharedEntry(entry: HistoryEntry): boolean {
  return entry.type === 'QUESTION' && QUESTION_CARDS[entry.cardId].category === 'SHARED';
}

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

export function SpectatorQuestionLog({
  history,
  firstName,
  secondName,
}: {
  history: HistoryEntry[];
  firstName: string;
  secondName: string;
}) {
  const nameOf = (role: PlayerRole) => (role === 'FIRST' ? firstName : secondName);
  const personalHistory = history.filter((e) => !isSharedEntry(e));
  const firstEntries = [...personalHistory].reverse().filter((e) => historyEntryRole(e) === 'FIRST');
  const secondEntries = [...personalHistory].reverse().filter((e) => historyEntryRole(e) === 'SECOND');
  const sharedEntries = [...history].reverse().filter(isSharedEntry);

  return (
    <div>
      <div className="panel-title">質問履歴</div>
      <div className="question-log-columns">
        <div className="question-log-column">
          <div className="question-log-column-title">{firstName}(先攻)の質問</div>
          <div className="question-log">
            {firstEntries.length === 0 && <p className="hint-text">まだ質問がありません。</p>}
            {firstEntries.map((entry, i) => renderEntry(entry, i, nameOf(historyEntryRole(entry)), secondName))}
          </div>
        </div>
        <div className="question-log-column">
          <div className="question-log-column-title">{secondName}(後攻)の質問</div>
          <div className="question-log">
            {secondEntries.length === 0 && <p className="hint-text">まだ質問がありません。</p>}
            {secondEntries.map((entry, i) => renderEntry(entry, i, nameOf(historyEntryRole(entry)), firstName))}
          </div>
        </div>
      </div>
      <div className="question-log-shared">
        <div className="question-log-column-title">共有情報</div>
        <div className="question-log">
          {sharedEntries.length === 0 && <p className="hint-text">まだ共有情報の質問がありません。</p>}
          {sharedEntries.map((entry, i) => {
            const askerRole = historyEntryRole(entry);
            return renderEntry(entry, i, nameOf(askerRole), askerRole === 'FIRST' ? secondName : firstName);
          })}
        </div>
      </div>
    </div>
  );
}
