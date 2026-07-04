export type QuestionCardId =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;

export type QuestionCardCategory = 'NORMAL' | 'SHARED' | 'CHOICE';

export interface QuestionCardDefinition {
  id: QuestionCardId;
  label: string;
  category: QuestionCardCategory;
  choices?: readonly [number, number];
}

export const QUESTION_CARDS: Record<QuestionCardId, QuestionCardDefinition> = {
  1: { id: 1, label: '赤の合計値', category: 'NORMAL' },
  2: { id: 2, label: '最大値-最小値', category: 'SHARED' },
  3: { id: 3, label: '赤タイルの枚数', category: 'NORMAL' },
  4: { id: 4, label: '大きい方から3枚の合計(位置3-5)', category: 'NORMAL' },
  5: { id: 5, label: '同数字ペアの組数(0〜2組)', category: 'NORMAL' },
  6: { id: 6, label: '小さい方から3枚の合計(位置1-3)', category: 'NORMAL' },
  7: { id: 7, label: '連番になっている位置', category: 'NORMAL' },
  8: { id: 8, label: '5がある位置', category: 'NORMAL' },
  9: { id: 9, label: '8または9の位置', category: 'CHOICE', choices: [8, 9] },
  10: { id: 10, label: '青の合計値', category: 'NORMAL' },
  11: { id: 11, label: '中央(位置3)が5以上か4以下か', category: 'SHARED' },
  12: { id: 12, label: '1または2の位置', category: 'CHOICE', choices: [1, 2] },
  13: { id: 13, label: '青タイルの枚数', category: 'NORMAL' },
  14: { id: 14, label: '偶数の枚数(0含む)', category: 'NORMAL' },
  15: { id: 15, label: '奇数の枚数', category: 'NORMAL' },
  16: { id: 16, label: '同じ色が隣接する位置', category: 'NORMAL' },
  17: { id: 17, label: '5枚全ての合計', category: 'SHARED' },
  18: { id: 18, label: '3または4の位置', category: 'CHOICE', choices: [3, 4] },
  19: { id: 19, label: '6または7の位置', category: 'CHOICE', choices: [6, 7] },
  20: { id: 20, label: '0がある位置', category: 'NORMAL' },
  21: { id: 21, label: '中央3枚の合計(位置2-4)', category: 'NORMAL' },
};

export const ALL_QUESTION_CARD_IDS = Object.keys(QUESTION_CARDS).map(Number) as QuestionCardId[];
