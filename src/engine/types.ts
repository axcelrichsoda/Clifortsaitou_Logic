export type Color = 'RED' | 'BLUE' | 'YELLOW';

export interface Tile {
  number: number; // 0-9
  color: Color;
}

export type Hand = Tile[]; // always length 5, always canonically sorted (see hand.ts)
