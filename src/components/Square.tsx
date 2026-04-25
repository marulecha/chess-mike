import type React from 'react';
import type { Color, PieceType, Square as SquareName } from '../types/chess';
import { Piece } from './Piece';

export type Highlight = 'none' | 'selected' | 'move' | 'capture' | 'lastMove' | 'check';

export type SquareProps = {
  name: SquareName;
  piece: { color: Color; type: PieceType } | null;
  highlight: Highlight;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
};

function isLight(name: SquareName): boolean {
  const file = name.charCodeAt(0) - 97; // a..h -> 0..7
  const rank = parseInt(name[1], 10) - 1; // 1..8 -> 0..7
  return (file + rank) % 2 === 1;
}

export function Square({ name, piece, highlight, onClick, onDragStart, onDrop, onDragOver }: SquareProps) {
  const base = isLight(name) ? 'bg-imperial-cream' : 'bg-imperial-burgundy';
  const highlightClass =
    highlight === 'selected' ? 'shadow-gold-glow' :
    highlight === 'lastMove' ? 'ring-2 ring-imperial-gold/60 ring-inset' :
    highlight === 'check' ? 'ring-4 ring-red-600 ring-inset' :
    '';
  return (
    <div
      data-testid={`square-${name}`}
      className={`relative aspect-square ${base} ${highlightClass} cursor-pointer`}
      onClick={onClick}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {piece && <Piece color={piece.color} type={piece.type} />}
      {highlight === 'move' && (
        <span data-testid="legal-dot" className="absolute inset-0 m-auto w-1/4 h-1/4 rounded-full bg-imperial-gold/70" />
      )}
      {highlight === 'capture' && (
        <span data-testid="legal-ring" className="absolute inset-1 rounded-full ring-4 ring-imperial-gold/70" />
      )}
    </div>
  );
}
