import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import type { Move } from 'chess.js';
import { materialCapturedBy, materialDiff, PIECE_VALUES } from './material';

function historyFromPgn(pgn: string): Move[] {
  const c = new Chess();
  c.loadPgn(pgn);
  return c.history({ verbose: true }) as Move[];
}

describe('material', () => {
  it('returns 0 for an empty history', () => {
    expect(materialCapturedBy([], 'w')).toBe(0);
    expect(materialCapturedBy([], 'b')).toBe(0);
    expect(materialDiff([], 'w')).toBe(0);
  });

  it('counts a single pawn capture by white', () => {
    const h = historyFromPgn('1. e4 d5 2. exd5');
    expect(materialCapturedBy(h, 'w')).toBe(PIECE_VALUES.p); // 1
    expect(materialCapturedBy(h, 'b')).toBe(0);
    expect(materialDiff(h, 'w')).toBe(1);
    expect(materialDiff(h, 'b')).toBe(-1);
  });

  it('counts captures and reports a positive diff for the side ahead', () => {
    // Verifiable line: white captures a knight; black captures a pawn.
    // 1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. Bxc6 dxc6
    // After 4...dxc6: white has captured Nc6 (3); black has captured Bc6 (3) too.
    // Use a different line where the diff is non-zero:
    // 1. e4 d5 2. exd5 Nf6 3. c4 c6 4. dxc6 Nxc6
    // White captured: pawn (d5) + pawn (c6) = 2
    // Black captured: pawn (c6) = 1
    const h = historyFromPgn('1. e4 d5 2. exd5 Nf6 3. c4 c6 4. dxc6 Nxc6');
    expect(materialCapturedBy(h, 'w')).toBe(2);
    expect(materialCapturedBy(h, 'b')).toBe(1);
    expect(materialDiff(h, 'w')).toBe(1);
    expect(materialDiff(h, 'b')).toBe(-1);
  });

  it('handles a knight capture', () => {
    // 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 -> white captured a knight
    const h = historyFromPgn('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6');
    expect(materialCapturedBy(h, 'w')).toBe(PIECE_VALUES.n); // 3
    expect(materialCapturedBy(h, 'b')).toBe(0);
    expect(materialDiff(h, 'w')).toBe(3);
    expect(materialDiff(h, 'b')).toBe(-3);
  });
});
