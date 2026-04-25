import { useGame } from '../game/GameProvider';

export function ControlsPanel() {
  const { game, timer, settings, setSettings } = useGame();
  const flip = () => setSettings({
    ...settings,
    boardOrientation: settings.boardOrientation === 'white' ? 'black' : 'white',
  });
  const newGame = () => { game.reset(); timer.reset(); };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={newGame}>New Game</Button>
      <Button onClick={() => game.undo()}>Undo</Button>
      <Button onClick={() => game.resign(game.turn)}>Resign</Button>
      <Button onClick={flip}>Flip</Button>
    </div>
  );
}

function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-imperial-cream border border-imperial-gold/70 bg-imperial-navy hover:shadow-gold-glow rounded-sm px-3 py-2"
    >
      {children}
    </button>
  );
}
