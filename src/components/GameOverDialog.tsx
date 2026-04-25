import type { GameStatus } from '../types/chess';

const TITLES: Record<GameStatus, string> = {
  'idle': '',
  'in-progress': '',
  'checkmate': 'Checkmate',
  'stalemate': 'Stalemate',
  'draw': 'Draw',
  'resigned': 'Resignation',
  'timeout': 'Time Out',
  'disconnect': 'Forfeit',
};

export function GameOverDialog({
  status, winnerLabel, onNewGame, onClose,
}: {
  status: GameStatus;
  winnerLabel: string;
  onNewGame: () => void;
  onClose: () => void;
}) {
  if (status === 'idle' || status === 'in-progress') return null;
  return (
    <div
      data-testid="game-over-backdrop"
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-imperial-crimson border-2 border-imperial-gold rounded-sm shadow-imperial p-8 w-[400px] text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2 right-3 text-imperial-gold/70 hover:text-imperial-gold text-xl leading-none"
        >×</button>
        <h2 className="font-display text-imperial-gold text-3xl mb-2">{TITLES[status]}</h2>
        <p className="font-body text-imperial-cream/90 mb-6">{winnerLabel}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onNewGame}
            className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
          >New Duel</button>
          <button
            onClick={onClose}
            className="font-display text-imperial-cream/70 border border-imperial-gold/40 hover:text-imperial-cream rounded-sm px-4 py-2"
          >View Board</button>
        </div>
      </div>
    </div>
  );
}
