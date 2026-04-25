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
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div className="bg-imperial-navy border-2 border-imperial-gold rounded-sm shadow-imperial p-8 w-[400px] text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-imperial-gold text-3xl mb-2">{TITLES[status]}</h2>
        <p className="font-body text-imperial-cream/90 mb-6">{winnerLabel}</p>
        <button
          onClick={onNewGame}
          className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
        >New Duel</button>
      </div>
    </div>
  );
}
