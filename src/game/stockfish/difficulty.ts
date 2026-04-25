import type { Difficulty } from '../../types/chess';

export type EngineConfig = { skill: number; movetimeMs: number };

const TABLE: Record<Difficulty, EngineConfig> = {
  easy:   { skill: 3,  movetimeMs: 200 },
  medium: { skill: 10, movetimeMs: 700 },
  hard:   { skill: 20, movetimeMs: 1500 },
};

export function difficultyToConfig(d: Difficulty): EngineConfig {
  return TABLE[d];
}
