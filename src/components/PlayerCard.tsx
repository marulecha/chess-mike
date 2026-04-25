import type { Color } from '../types/chess';
import { useGame } from '../game/GameProvider';
import { Clock } from './Clock';
import { CapturedPieces } from './CapturedPieces';
import { materialDiff } from '../game/material';

export function PlayerCard({ color }: { color: Color }) {
  const { game, timer, settings } = useGame();
  const ms = color === 'w' ? timer.whiteMs : timer.blackMs;
  const clockActive = timer.runningSide === color;
  const turnActive = game.turn === color && (game.status === 'in-progress' || game.status === 'idle');
  const label = color === 'w' ? 'White' : 'Black';
  const isMichalisSide = settings.mode === 'human-vs-ai' &&
    ((settings.playerColor === 'white' && color === 'b') ||
     (settings.playerColor === 'black' && color === 'w'));

  const diff = materialDiff(game.history, color);

  return (
    <div
      className={
        'bg-imperial-crimson/40 border border-imperial-gold/40 rounded-sm p-3 flex flex-col gap-2 transition-all ' +
        (turnActive ? 'border-l-4 border-l-imperial-gold shadow-gold-glow/30' : '')
      }
      data-testid={`player-card-${color}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-imperial-gold text-lg flex items-center gap-2">
          {turnActive && (
            <span
              data-testid={`turn-marker-${color}`}
              className="inline-block w-1.5 h-1.5 rounded-full bg-imperial-gold animate-pulse"
              aria-label="active turn"
            />
          )}
          {isMichalisSide ? 'Emperor Michalis' : label}
        </span>
        {settings.timeControl && <Clock ms={ms} active={clockActive} />}
      </div>
      <div className="flex items-center justify-between gap-2 min-h-8">
        <CapturedPieces capturedBy={color} />
        {diff > 0 && (
          <span
            data-testid={`material-diff-${color}`}
            className="font-mono text-imperial-gold text-sm whitespace-nowrap"
          >
            +{diff}
          </span>
        )}
      </div>
    </div>
  );
}
