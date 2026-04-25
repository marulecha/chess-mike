import { useGame } from '../game/GameProvider';

export function ControlsPanel() {
  const { game, timer, settings, setSettings, online } = useGame();
  const isOnline = settings.mode === 'two-players-online';
  const isAI = settings.mode === 'human-vs-ai';
  const humanColor = settings.playerColor === 'white' ? 'w' : 'b';

  const flip = () => setSettings({
    ...settings,
    boardOrientation: settings.boardOrientation === 'white' ? 'black' : 'white',
  });

  const newGame = () => { game.reset(); timer.reset(); };

  const undo = () => {
    if (isAI) {
      // Pop both AI's response and the human's previous move so the human can
      // re-think without the AI instantly re-playing the same answer.
      // If the last move was the human's (e.g. they just moved and AI hasn't
      // replied yet), one undo is enough.
      const last = game.history.at(-1);
      const lastWasAI = last && last.color !== humanColor;
      game.undo();
      if (lastWasAI) game.undo();
    } else {
      game.undo();
    }
  };

  const resign = () => {
    game.resign(game.turn);
    if (isOnline && online) online.sendResign();
  };

  const canUndo = !isOnline && game.history.length > 0;
  const canResign = game.status === 'in-progress';

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={newGame}>New Game</Button>
      <Button onClick={undo} disabled={!canUndo} title={isOnline ? 'Undo is disabled in online games' : undefined}>
        Undo
      </Button>
      <Button onClick={resign} disabled={!canResign}>Resign</Button>
      <Button onClick={flip}>Flip</Button>
    </div>
  );
}

function Button({
  onClick, children, disabled, title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="font-display text-imperial-cream border border-imperial-gold/70 bg-imperial-crimson hover:shadow-gold-glow rounded-sm px-3 py-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
    >
      {children}
    </button>
  );
}
