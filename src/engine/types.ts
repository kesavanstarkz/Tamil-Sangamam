export type Mei = { kind: "mei"; base: string };
export type Uyir = { kind: "uyir"; id: number };
export type Uyirmei = { kind: "uyirmei"; base: string; uyirId: number };
export type Tile = Mei | Uyir | Uyirmei;

export interface LevelDefinition {
  id: number;
  word: string;
  chapter: number;
  pool: string[];
  hint: string;
}
