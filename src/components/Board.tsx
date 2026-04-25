import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Square as SquareCmp, type Highlight } from './Square';
import { PromotionPicker } from './PromotionPicker';
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

// Compute (col, row) 0..7 in display order for a given square + orientation.
function squareToCell(sq: Square, orientation: 'white' | 'black'): { col: number; row: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10) - 1;
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  return { col, row };
}

export function Board() {
  const { game, settings, online, stockfish } = useGame();
  const isOnline = settings.mode === 'two-players-online' && online !== null;
  const isAI = settings.mode === 'human-vs-ai';
  const humanColor: Color = settings.playerColor === 'white' ? 'w' : 'b';
  const isMyTurn =
    isOnline ? online!.myColor === game.turn :
    isAI ? game.turn === humanColor && !stockfish.aiThinking :
    true;
  const [selected, setSelected] = useState<Square | null>(null);
  const [hoveredFrom, setHoveredFrom] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const board = useMemo(() => new Chess(game.fen).board(), [game.fen]);
  const pieceAt = (sq: Square): { color: Color; type: PieceType } | null => {
    const file = sq.charCodeAt(0) - 97;
    const rank = 8 - parseInt(sq[1], 10);
    const cell = board[rank][file];
    if (!cell) return null;
    return { color: cell.color as Color, type: cell.type as PieceType };
  };

  const legalTargets: Square[] = selected ? game.legalMovesFrom(selected) : [];
  const hoverTargets: Square[] =
    !selected && hoveredFrom && isMyTurn ? game.legalMovesFrom(hoveredFrom) : [];
  const lastMove = game.history.at(-1);

  useEffect(() => { setSelected(null); setHoveredFrom(null); }, [game.history.length, game.status]);

  function isPromotionMove(from: Square, to: Square): boolean {
    const piece = pieceAt(from);
    if (!piece || piece.type !== 'p') return false;
    const targetRank = parseInt(to[1], 10);
    return (piece.color === 'w' && targetRank === 8) || (piece.color === 'b' && targetRank === 1);
  }

  function tryMove(from: Square, to: Square) {
    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
      return;
    }
    const ok = game.move(from, to, undefined);
    if (ok && isOnline) online!.sendMove({ from, to });
    setSelected(null);
  }

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

  function hoverHintFor(sq: Square): 'move' | 'capture' | null {
    if (!hoverTargets.includes(sq)) return null;
    return pieceAt(sq) ? 'capture' : 'move';
  }

  function onSquareClick(sq: Square) {
    if (!isMyTurn) return;
    const piece = pieceAt(sq);
    if (selected) {
      if (selected === sq) { setSelected(null); return; }
      if (legalTargets.includes(sq)) { tryMove(selected, sq); return; }
      if (piece && piece.color === game.turn) { setSelected(sq); return; }
      setSelected(null);
      return;
    }
    if (piece && piece.color === game.turn) setSelected(sq);
  }

  function onSquareEnter(sq: Square) {
    if (!isMyTurn || selected) return;
    const piece = pieceAt(sq);
    if (piece && piece.color === game.turn) setHoveredFrom(sq);
    else if (hoveredFrom) setHoveredFrom(null);
  }
  function onSquareLeave(sq: Square) {
    if (hoveredFrom === sq) setHoveredFrom(null);
  }

  function onDragStart(sq: Square, e: React.DragEvent) {
    if (!isMyTurn) { e.preventDefault(); return; }
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
    tryMove(from, target);
  }

  const squares = squaresInOrder(settings.boardOrientation);
  const filesForLabels = settings.boardOrientation === 'white' ? FILES : [...FILES].reverse();
  const ranksForLabels = settings.boardOrientation === 'white' ? RANKS : [...RANKS].reverse();

  return (
    <>
      {/* Coordinate-bordered, layered gilded frame */}
      <div className="relative w-full max-w-[640px]">
        <div className="grid grid-cols-[1.25rem_1fr] grid-rows-[1fr_1.25rem] gap-1">
          {/* Rank labels (left) */}
          <div className="flex flex-col justify-around items-center font-mono text-imperial-gold/70 text-[0.7rem] tracking-widest">
            {ranksForLabels.map((r) => (
              <span key={r} data-testid={`rank-${r}`}>{r}</span>
            ))}
          </div>
          {/* The board itself */}
          <div className="relative p-[10px] bg-gradient-to-br from-[#9A7A3D] via-imperial-gold to-[#9A7A3D] rounded-sm shadow-imperial">
            <div className="p-[3px] bg-imperial-noir rounded-[2px]">
              <div className="p-[2px] bg-gradient-to-br from-[#E8C572] via-imperial-gold to-[#9A7A3D] rounded-[1px]">
                <div className="relative">
                  <div className="grid grid-cols-8 aspect-square">
                    {squares.map((sq) => (
                      <SquareCmp
                        key={sq}
                        name={sq}
                        piece={pieceAt(sq)}
                        highlight={highlightFor(sq)}
                        hoverHint={hoverHintFor(sq)}
                        onClick={() => onSquareClick(sq)}
                        onPointerEnter={() => onSquareEnter(sq)}
                        onPointerLeave={() => onSquareLeave(sq)}
                        onDragStart={(e) => onDragStart(sq, e)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(sq, e)}
                      />
                    ))}
                  </div>
                  {lastMove && <LastMoveArrow from={lastMove.from as Square} to={lastMove.to as Square} orientation={settings.boardOrientation} />}
                </div>
              </div>
            </div>
          </div>
          {/* Empty bottom-left corner */}
          <div />
          {/* File labels (bottom) */}
          <div className="flex justify-around items-center font-mono text-imperial-gold/70 text-[0.7rem] tracking-widest uppercase">
            {filesForLabels.map((f) => (
              <span key={f} data-testid={`file-${f}`}>{f}</span>
            ))}
          </div>
        </div>
      </div>
      {pendingPromotion && (
        <PromotionPicker
          color={game.turn}
          onSelect={(p) => {
            const ok = game.move(pendingPromotion.from, pendingPromotion.to, p);
            if (ok && isOnline) online!.sendMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: p });
            setPendingPromotion(null);
            setSelected(null);
          }}
          onCancel={() => { setPendingPromotion(null); setSelected(null); }}
        />
      )}
    </>
  );
}

function LastMoveArrow({ from, to, orientation }: { from: Square; to: Square; orientation: 'white' | 'black' }) {
  const a = squareToCell(from, orientation);
  const b = squareToCell(to, orientation);
  // Coordinates are in 0..7 grid units; scale to 0..100 viewBox with 12.5 per cell, centered.
  const cell = 12.5;
  const cx1 = a.col * cell + cell / 2;
  const cy1 = a.row * cell + cell / 2;
  const cx2 = b.col * cell + cell / 2;
  const cy2 = b.row * cell + cell / 2;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
      data-testid="last-move-arrow"
    >
      <defs>
        <marker id="lm-arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#D4AF6F" opacity="0.85" />
        </marker>
      </defs>
      <line
        x1={cx1} y1={cy1} x2={cx2} y2={cy2}
        stroke="#D4AF6F"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
        markerEnd="url(#lm-arrow-head)"
      />
    </svg>
  );
}
