import type { Move } from 'chess.js';
import type { Color, PieceType } from '../types/chess';

export const PIECE_VALUES: Record<PieceType, number> = {
  q: 9, r: 5, b: 3, n: 3, p: 1, k: 0,
};

/**
 * Total point value of pieces captured BY the given side.
 * (i.e. enemy pieces this side has taken off the board.)
 */
export function materialCapturedBy(history: Move[], side: Color): number {
  let total = 0;
  for (const m of history) {
    if (!m.captured) continue;
    if (m.color === side) total += PIECE_VALUES[m.captured as PieceType] ?? 0;
  }
  return total;
}

/**
 * Difference (capturedBy(side) - capturedBy(other)).
 * Positive => `side` is materially ahead by that many pawn-equivalents.
 * Negative => `side` is materially behind.
 */
export function materialDiff(history: Move[], side: Color): number {
  const other: Color = side === 'w' ? 'b' : 'w';
  return materialCapturedBy(history, side) - materialCapturedBy(history, other);
}
