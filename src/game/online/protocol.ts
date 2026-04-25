import type { Promotion, Square } from '../../types/chess';

export type TimeControl = { initialMs: number; incrementMs: number };

export type Hello = {
  type: 'hello';
  color: 'w' | 'b';                  // the joiner's color
  timeControl: TimeControl | null;
};

export type WireMove = {
  type: 'move';
  from: Square;
  to: Square;
  promotion?: Promotion;
};

export type WireResign = { type: 'resign' };

export type WireResync = {
  type: 'resync';
  fen: string;
  pgn: string;
};

export type WireMsg = Hello | WireMove | WireResign | WireResync;

export function isWireMsg(x: unknown): x is WireMsg {
  if (!x || typeof x !== 'object') return false;
  const t = (x as { type?: unknown }).type;
  return t === 'hello' || t === 'move' || t === 'resign' || t === 'resync';
}
