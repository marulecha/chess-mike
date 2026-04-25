function format(ms: number): string {
  if (ms < 10_000) return (Math.max(0, ms) / 1000).toFixed(1);
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Clock({ ms, active }: { ms: number; active: boolean }) {
  return (
    <div
      data-testid="clock"
      className={`font-mono text-3xl px-3 py-1 rounded-sm bg-imperial-navy border border-imperial-gold/60 ${active ? 'shadow-gold-glow' : ''}`}
    >
      {format(ms)}
    </div>
  );
}
