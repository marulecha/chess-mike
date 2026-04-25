import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Square as SquareCmp, type Highlight } from './Square';
import { useGame } from '../game/GameProvider';
import type { Color, PieceType, Square } from '../types/chess';

const FILES = ['a','b','c','d','e','f','g','h'] as const;
const RANKS = [8,7,6,5,4,3,2,1] as const;

function squaresInOrder(orientation: 'white' | 'black'): Square[] {
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();
  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const out: Square[] = [];
  for (const r of ranks) for (const f of files) out.push(`${f}${r}` as Square);
  return out;
}

export function Board() {
  const { game, settings } = useGame();
  const [selected, setSelected] = useState<Square | null>(null);

  const board = useMemo(() => new Chess(game.fen).board(), [game.fen]);
  const pieceAt = (sq: Square): { color: Color; type: PieceType } | null => {
    const file = sq.charCodeAt(0) - 97;
    const rank = 8 - parseInt(sq[1], 10);
    const cell = board[rank][file];
    if (!cell) return null;
    return { color: cell.color as Color, type: cell.type as PieceType };
  };

  const legalTargets: Square[] = selected ? game.legalMovesFrom(selected) : [];
  const lastMove = game.history.at(-1);

  useEffect(() => { setSelected(null); }, [game.history.length, game.status]);

  function highlightFor(sq: Square): Highlight {
    if (selected === sq) return 'selected';
    if (legalTargets.includes(sq)) {
      const target = pieceAt(sq);
      return target ? 'capture' : 'move';
    }
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) return 'lastMove';
    if (game.inCheck) {
      const piece = pieceAt(sq);
      if (piece && piece.type === 'k' && piece.color === game.turn) return 'check';
    }
    return 'none';
  }

  function onSquareClick(sq: Square) {
    const piece = pieceAt(sq);
    if (selected) {
      if (selected === sq) { setSelected(null); return; }
      if (legalTargets.includes(sq)) {
        const ok = game.move(selected, sq, undefined);
        if (ok) { setSelected(null); return; }
      }
      if (piece && piece.color === game.turn) { setSelected(sq); return; }
      setSelected(null);
      return;
    }
    if (piece && piece.color === game.turn) setSelected(sq);
  }

  function onDragStart(sq: Square, e: React.DragEvent) {
    const piece = pieceAt(sq);
    if (!piece || piece.color !== game.turn) { e.preventDefault(); return; }
    setSelected(sq);
    e.dataTransfer.setData('text/plain', sq);
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(target: Square, e: React.DragEvent) {
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain') as Square;
    if (!from) return;
    game.move(from, target, undefined);
    setSelected(null);
  }

  const squares = squaresInOrder(settings.boardOrientation);

  return (
    <div className="grid grid-cols-8 w-full max-w-[640px] aspect-square shadow-imperial border-4 border-imperial-gold rounded-sm">
      {squares.map((sq) => (
        <SquareCmp
          key={sq}
          name={sq}
          piece={pieceAt(sq)}
          highlight={highlightFor(sq)}
          onClick={() => onSquareClick(sq)}
          onDragStart={(e) => onDragStart(sq, e)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(sq, e)}
        />
      ))}
    </div>
  );
}
