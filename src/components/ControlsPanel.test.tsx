import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlsPanel } from './ControlsPanel';
import { GameProvider, useGame } from '../game/GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { useEffect } from 'react';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';

function Probe({ onState }: { onState: (s: string) => void }) {
  const { game, settings } = useGame();
  useEffect(() => { onState(`${game.history.length}-${settings.boardOrientation}-${game.status}`); });
  return null;
}

const stockfishOpts = { factory: () => new FakeStockfishWorker() as unknown as Worker };

describe('ControlsPanel', () => {
  it('Undo decrements history', async () => {
    const user = userEvent.setup();
    let last = '';
    function Seed() {
      const { game } = useGame();
      useEffect(() => { game.move('e2', 'e4'); }, []);
      return null;
    }
    render(
      <GameProvider
        initialSettings={{ ...DEFAULT_SETTINGS, mode: 'human-vs-human' }}
        stockfishOptions={stockfishOpts}
      >
        <Seed />
        <Probe onState={(s) => { last = s; }} />
        <ControlsPanel />
      </GameProvider>,
    );
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(last.startsWith('0-')).toBe(true);
  });

  it('Flip toggles orientation', async () => {
    const user = userEvent.setup();
    let last = '';
    render(
      <GameProvider initialSettings={DEFAULT_SETTINGS} stockfishOptions={stockfishOpts}>
        <Probe onState={(s) => { last = s; }} />
        <ControlsPanel />
      </GameProvider>,
    );
    await user.click(screen.getByRole('button', { name: /flip/i }));
    expect(last.includes('-black-')).toBe(true);
  });

  it('Resign sets status', async () => {
    const user = userEvent.setup();
    let last = '';
    render(
      <GameProvider initialSettings={DEFAULT_SETTINGS} stockfishOptions={stockfishOpts}>
        <Probe onState={(s) => { last = s; }} />
        <ControlsPanel />
      </GameProvider>,
    );
    await user.click(screen.getByRole('button', { name: /resign/i }));
    expect(last.endsWith('-resigned')).toBe(true);
  });
});
