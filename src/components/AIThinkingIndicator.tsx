import { useGame } from '../game/GameProvider';

export function AIThinkingIndicator() {
  const { stockfish } = useGame();
  if (!stockfish.aiThinking) return null;
  return (
    <div
      data-testid="ai-thinking"
      className="font-body text-imperial-gold/90 italic flex items-center gap-2 px-3 py-2 rounded-sm bg-imperial-crimson/40 border border-imperial-gold/30"
    >
      <span className="flex gap-1" aria-hidden>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-imperial-gold animate-pulse [animation-delay:0ms]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-imperial-gold animate-pulse [animation-delay:160ms]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-imperial-gold animate-pulse [animation-delay:320ms]" />
      </span>
      The Emperor contemplates…
    </div>
  );
}
