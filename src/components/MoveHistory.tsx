import { useEffect, useRef } from 'react';
import { useGame } from '../game/GameProvider';

export function MoveHistory() {
  const { game } = useGame();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const rows: { num: number; white?: string; black?: string }[] = [];
  game.history.forEach((m, i) => {
    const num = Math.floor(i / 2) + 1;
    if (i % 2 === 0) rows.push({ num, white: m.san });
    else rows[rows.length - 1].black = m.san;
  });

  // Scroll to the last row whenever a move is added.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [game.history.length]);

  const lastIndex = game.history.length - 1;
  const lastRow = Math.floor(lastIndex / 2);
  const lastSide: 'white' | 'black' | null = lastIndex < 0 ? null : (lastIndex % 2 === 0 ? 'white' : 'black');

  return (
    <div
      ref={scrollerRef}
      className="bg-imperial-crimson/60 border border-imperial-gold/40 rounded-sm p-3 max-h-80 overflow-y-auto font-mono text-sm"
    >
      <h4 className="font-display text-imperial-gold mb-2 text-base flex items-center justify-between">
        <span>Moves</span>
        <span className="text-imperial-cream/40 text-xs font-mono">
          {Math.ceil(game.history.length / 2)} ply
        </span>
      </h4>
      {rows.length === 0 ? (
        <p className="text-imperial-cream/30 italic text-xs">No moves yet.</p>
      ) : (
        <table className="w-full">
          <tbody>
            {rows.map((r, idx) => {
              const isLastRow = idx === lastRow;
              return (
                <tr key={r.num} className={isLastRow ? '' : 'opacity-70'}>
                  <td className="text-imperial-gold/60 pr-2 w-8">{r.num}.</td>
                  <td className={`pr-3 ${isLastRow && lastSide === 'white' ? 'text-imperial-gold font-semibold' : ''}`}>
                    {r.white}
                  </td>
                  <td className={isLastRow && lastSide === 'black' ? 'text-imperial-gold font-semibold' : ''}>
                    {r.black}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
