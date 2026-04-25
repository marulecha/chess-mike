import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider, useGame } from './GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';
import { FakeTrysteroBus } from '../test/mocks/fake-trystero';

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

  it('exposes online API when mode is two-players-online and a roomFactory is given', () => {
    const bus = new FakeTrysteroBus();
    const factory = (name: string) => bus.join(name);
    function OnlineProbe() {
      const { online } = useGame();
      return <span data-testid="online-status">{online?.status ?? 'none'}</span>;
    }
    render(
      <GameProvider
        initialSettings={{
          ...DEFAULT_SETTINGS,
          mode: 'two-players-online',
          online: { role: 'host', code: 'TEST01', hostInit: { color: 'white', timeControl: null } },
        }}
        roomFactory={factory}
        stockfishOptions={stockfishOptions}
      >
        <OnlineProbe />
      </GameProvider>,
    );
    expect(screen.getByTestId('online-status').textContent).toBe('waiting');
  });

  it('exposes online: null in non-online modes', () => {
    function NullProbe() {
      const { online } = useGame();
      return <span data-testid="online">{online === null ? 'null' : 'present'}</span>;
    }
    render(
      <GameProvider initialSettings={DEFAULT_SETTINGS} stockfishOptions={stockfishOptions}>
        <NullProbe />
      </GameProvider>,
    );
    expect(screen.getByTestId('online').textContent).toBe('null');
  });
});
