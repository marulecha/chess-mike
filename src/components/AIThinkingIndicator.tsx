import { useGame } from '../game/GameProvider';

export function AIThinkingIndicator() {
  const { stockfish } = useGame();
  if (!stockfish.aiThinking) return null;
  return (
    <div className="font-body text-imperial-gold/90 italic flex items-center gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-imperial-gold animate-pulse" />
      The Emperor contemplates…
    </div>
  );
}
