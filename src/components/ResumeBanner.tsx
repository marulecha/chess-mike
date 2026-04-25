type Props = { savedAt: number; onResume: () => void; onDiscard: () => void };

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

export function ResumeBanner({ savedAt, onResume, onDiscard }: Props) {
  return (
    <div className="bg-imperial-burgundy/40 border border-imperial-gold/60 px-4 py-3 rounded-sm flex items-center justify-between">
      <span>You have an unfinished duel from <strong>{relTime(savedAt)}</strong>.</span>
      <div className="flex gap-2">
        <button onClick={onResume} className="font-display text-imperial-cream border border-imperial-gold px-3 py-1 rounded-sm hover:shadow-gold-glow">Resume</button>
        <button onClick={onDiscard} className="font-display text-imperial-cream/80 px-3 py-1">Discard</button>
      </div>
    </div>
  );
}
