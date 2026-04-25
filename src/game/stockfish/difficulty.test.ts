import { describe, it, expect } from 'vitest';
import { difficultyToConfig } from './difficulty';

describe('difficultyToConfig', () => {
  it('maps easy', () => {
    expect(difficultyToConfig('easy')).toEqual({ skill: 3, movetimeMs: 200 });
  });
  it('maps medium', () => {
    expect(difficultyToConfig('medium')).toEqual({ skill: 10, movetimeMs: 700 });
  });
  it('maps hard', () => {
    expect(difficultyToConfig('hard')).toEqual({ skill: 20, movetimeMs: 1500 });
  });
});
