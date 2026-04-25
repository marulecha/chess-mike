import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import PlayPage from './PlayPage';
import { GameProvider } from '../game/GameProvider';
import { Board } from '../components/Board';
import { OnlineMoveBridge } from '../game/online/OnlineMoveBridge';
import { FakeTrysteroBus } from '../test/mocks/fake-trystero';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';
import { DEFAULT_SETTINGS } from '../types/chess';

beforeEach(() => {
  localStorage.clear();
  class StubWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    addEventListener() {}
    removeEventListener() {}
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal('Worker', StubWorker as unknown as typeof Worker);
});

describe('PlayPage', () => {
  it('shows setup modal on first visit', () => {
    render(<MemoryRouter><PlayPage /></MemoryRouter>);
    expect(screen.getByText(/Prepare for Battle/i)).toBeInTheDocument();
  });
});

describe('Online move bridge (integration)', () => {
  it('two GameProviders in the same room synchronize moves', async () => {
    const bus = new FakeTrysteroBus();
    const factory = (name: string) => bus.join(name);

    render(
      <>
        <GameProvider
          initialSettings={{
            ...DEFAULT_SETTINGS,
            mode: 'two-players-online',
            timeControl: null,
            online: { role: 'host', code: 'SYNC01', hostInit: { color: 'white', timeControl: null } },
          }}
          roomFactory={factory}
          stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
        >
          <Board />
          <OnlineMoveBridge />
        </GameProvider>
        <GameProvider
          initialSettings={{
            ...DEFAULT_SETTINGS,
            mode: 'two-players-online',
            timeControl: null,
            online: { role: 'join', code: 'SYNC01' },
          }}
          roomFactory={factory}
          stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
        >
          <Board />
          <OnlineMoveBridge />
        </GameProvider>
      </>
    );

    await waitFor(() => expect(screen.getAllByTestId('square-e2')).toHaveLength(2));

    const allE2 = screen.getAllByTestId('square-e2');
    const allE4 = screen.getAllByTestId('square-e4');
    const user = userEvent.setup();

    // Click on host's e2 → e4
    await user.click(allE2[0]);
    await user.click(allE4[0]);

    await waitFor(() => {
      expect(allE4[0].querySelector('img')).toBeTruthy();
      expect(allE4[1].querySelector('img')).toBeTruthy();
    });
  });
});
