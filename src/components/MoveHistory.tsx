import { useGame } from '../game/GameProvider';

export function MoveHistory() {
  const { game } = useGame();
  const rows: { num: number; white?: string; black?: string }[] = [];
  game.history.forEach((m, i) => {
    const num = Math.floor(i / 2) + 1;
    if (i % 2 === 0) rows.push({ num, white: m.san });
    else rows[rows.length - 1].black = m.san;
  });
  return (
    <div className="bg-imperial-crimson/60 border border-imperial-gold/40 rounded-sm p-3 max-h-80 overflow-y-auto font-mono text-sm">
      <h4 className="font-display text-imperial-gold mb-2 text-base">Moves</h4>
      <table className="w-full">
        <tbody>
          {rows.map((r) => (
            <tr key={r.num}>
              <td className="text-imperial-gold/60 pr-2 w-8">{r.num}.</td>
              <td className="pr-3">{r.white}</td>
              <td>{r.black}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
