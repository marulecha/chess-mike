import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from './Board';
import { GameProvider } from '../game/GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';
import { FakeTrysteroBus } from '../test/mocks/fake-trystero';

const renderBoard = () => render(
  <GameProvider
    initialSettings={{ ...DEFAULT_SETTINGS, mode: 'human-vs-human', timeControl: null }}
    stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
  >
    <Board />
  </GameProvider>,
);

describe('Board', () => {
  it('renders 64 squares', () => {
    renderBoard();
    expect(screen.getAllByTestId(/^square-/)).toHaveLength(64);
  });

  it('clicking a piece highlights its legal moves', async () => {
    const user = userEvent.setup();
    renderBoard();
    await user.click(screen.getByTestId('square-e2'));
    const dots = screen.getAllByTestId('legal-dot');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  it('clicking a piece then a legal target plays the move', async () => {
    const user = userEvent.setup();
    renderBoard();
    await user.click(screen.getByTestId('square-e2'));
    await user.click(screen.getByTestId('square-e4'));
    expect(screen.getByTestId('square-e4').querySelector('img')).toBeTruthy();
    expect(screen.getByTestId('square-e2').querySelector('img')).toBeFalsy();
  });

  it('disables input when it is not my turn (online)', async () => {
    const user = userEvent.setup();
    const bus = new FakeTrysteroBus();
    // Pre-create a peer in the room so host transitions to "connected" with myColor
    bus.join('michalis-chess-master:OFFLNE');
    render(
      <GameProvider
        initialSettings={{
          ...DEFAULT_SETTINGS,
          mode: 'two-players-online',
          timeControl: null,
          online: { role: 'host', code: 'OFFLNE', hostInit: { color: 'black', timeControl: null } },
        }}
        roomFactory={(name) => bus.join(name)}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Board />
      </GameProvider>,
    );
    // Host picked black -> myColor='b'. White moves first -> not my turn -> click should do nothing.
    const before = screen.getByTestId('square-e2').querySelector('img');
    await user.click(screen.getByTestId('square-e2'));
    await user.click(screen.getByTestId('square-e4'));
    expect(screen.getByTestId('square-e2').querySelector('img')).toBe(before);
  });

  it('broadcasts local moves to the peer (online)', async () => {
    const user = userEvent.setup();
    const bus = new FakeTrysteroBus();
    const got: unknown[] = [];

    render(
      <GameProvider
        initialSettings={{
          ...DEFAULT_SETTINGS,
          mode: 'two-players-online',
          timeControl: null,
          online: { role: 'host', code: 'BCAST1', hostInit: { color: 'white', timeControl: null } },
        }}
        roomFactory={(name) => bus.join(name)}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Board />
      </GameProvider>,
    );

    // Host's effect has run and registered onPeerJoin. Now have a peer join so
    // the host's onPeerJoin fires (sets myColor='w') and our recvMove can capture.
    const peer = bus.join('michalis-chess-master:BCAST1');
    const [, recvMove] = peer.makeAction<unknown>('move');
    recvMove((m) => got.push(m));

    // Flush the microtask that defers setStatus('connected') + sendHello inside the host
    await waitFor(() => {
      expect(screen.getByTestId('square-e2').querySelector('img')).toBeTruthy();
    });
    await new Promise((r) => setTimeout(r, 0));

    await user.click(screen.getByTestId('square-e2'));
    await user.click(screen.getByTestId('square-e4'));
    expect(got).toEqual([{ type: 'move', from: 'e2', to: 'e4' }]);
  });
});
