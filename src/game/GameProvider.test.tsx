import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider, useGame } from './GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';

function Probe() {
  const g = useGame();
  return (
    <div>
      <span data-testid="turn">{g.game.turn}</span>
      <span data-testid="mode">{g.settings.mode}</span>
      <button onClick={() => g.setSettings({ ...g.settings, mode: 'human-vs-human' })}>set hvh</button>
    </div>
  );
}

const stockfishOptions = { factory: () => new FakeStockfishWorker() as unknown as Worker };

describe('GameProvider', () => {
  it('exposes settings and game state', () => {
    render(
      <GameProvider initialSettings={DEFAULT_SETTINGS} stockfishOptions={stockfishOptions}>
        <Probe />
      </GameProvider>,
    );
    expect(screen.getByTestId('turn').textContent).toBe('w');
    expect(screen.getByTestId('mode').textContent).toBe(DEFAULT_SETTINGS.mode);
  });

  it('updates settings via setSettings', async () => {
    const user = userEvent.setup();
    render(
      <GameProvider initialSettings={DEFAULT_SETTINGS} stockfishOptions={stockfishOptions}>
        <Probe />
      </GameProvider>,
    );
    await user.click(screen.getByText('set hvh'));
    expect(screen.getByTestId('mode').textContent).toBe('human-vs-human');
  });
});
