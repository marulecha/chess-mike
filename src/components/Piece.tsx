import type { Color, PieceType } from '../types/chess';

const NAMES: Record<PieceType, string> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

export function Piece({ color, type }: { color: Color; type: PieceType }) {
  const file = `${color}${type.toUpperCase()}.svg`;
  const colorWord = color === 'w' ? 'white' : 'black';
  return (
    <img
      src={`/pieces/${file}`}
      alt={`${colorWord} ${NAMES[type]}`}
      draggable
      className="w-full h-full pointer-events-none select-none"
    />
  );
}
