import type { Color } from '../types/chess';
import { useGame } from '../game/GameProvider';
import { Clock } from './Clock';
import { CapturedPieces } from './CapturedPieces';

export function PlayerCard({ color }: { color: Color }) {
  const { timer, settings } = useGame();
  const ms = color === 'w' ? timer.whiteMs : timer.blackMs;
  const active = timer.runningSide === color;
  const label = color === 'w' ? 'White' : 'Black';
  const isMichalisSide = settings.mode === 'human-vs-ai' &&
    ((settings.playerColor === 'white' && color === 'b') ||
     (settings.playerColor === 'black' && color === 'w'));
  return (
    <div className="bg-imperial-navy/40 border border-imperial-gold/40 rounded-sm p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-imperial-gold text-lg">
          {isMichalisSide ? 'Emperor Michalis' : label}
        </span>
        {settings.timeControl && <Clock ms={ms} active={active} />}
      </div>
      <CapturedPieces capturedBy={color} />
    </div>
  );
}
