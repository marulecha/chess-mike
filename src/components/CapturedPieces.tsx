import { useGame } from '../game/GameProvider';
import { Piece } from './Piece';
import type { Color, PieceType } from '../types/chess';

export function CapturedPieces({ capturedBy }: { capturedBy: Color }) {
  const { game } = useGame();
  const captured: PieceType[] = [];
  for (const m of game.history) {
    if (!m.captured) continue;
    if (m.color === capturedBy) captured.push(m.captured as PieceType);
  }
  const enemyColor: Color = capturedBy === 'w' ? 'b' : 'w';
  const order: Record<PieceType, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };
  captured.sort((a, b) => order[b] - order[a]);
  return (
    <div className="flex gap-1 min-h-8">
      {captured.map((t, i) => (
        <span key={i} className="w-6 h-6 inline-block">
          <Piece color={enemyColor} type={t} />
        </span>
      ))}
    </div>
  );
}
