export type Square =
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Promotion = 'q' | 'r' | 'b' | 'n';

export type GameMode = 'human-vs-human' | 'human-vs-ai';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Orientation = 'white' | 'black';

export type GameStatus =
  | 'idle'
  | 'in-progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'timeout';

export type GameSettings = {
  mode: GameMode;
  aiDifficulty: Difficulty;
  playerColor: 'white' | 'black';
  timeControl: { initialMs: number; incrementMs: number } | null;
  boardOrientation: Orientation;
};

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'human-vs-ai',
  aiDifficulty: 'medium',
  playerColor: 'white',
  timeControl: { initialMs: 5 * 60 * 1000, incrementMs: 0 },
  boardOrientation: 'white',
};
