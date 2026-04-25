import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStockfish } from './useStockfish';
import { FakeStockfishWorker } from '../../test/mocks/fake-stockfish';

describe('useStockfish', () => {
  it('initializes and serves a best move', async () => {
    const fake = new FakeStockfishWorker();
    const { result } = renderHook(() => useStockfish({ factory: () => fake as unknown as Worker }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    fake.bestmoveResponse = 'bestmove d2d4';
    let mv;
    await act(async () => {
      mv = await result.current.requestMove('startpos-fen', 'medium');
    });
    expect(mv).toEqual({ from: 'd2', to: 'd4', promotion: undefined });
  });

  it('reports unavailable when factory throws', async () => {
    const { result } = renderHook(() => useStockfish({
      factory: () => { throw new Error('no worker'); },
    }));
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.ready).toBe(false);
  });

  it('aiThinking is true while waiting for bestmove', async () => {
    const fake = new FakeStockfishWorker();
    const { result } = renderHook(() => useStockfish({ factory: () => fake as unknown as Worker }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.requestMove('fen', 'easy');
    });
    expect(result.current.aiThinking).toBe(true);
    await act(async () => { await promise; });
    expect(result.current.aiThinking).toBe(false);
  });
});
