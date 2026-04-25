import { describe, it, expect } from 'vitest';
import { StockfishClient } from './worker-client';
import { FakeStockfishWorker } from '../../test/mocks/fake-stockfish';

describe('StockfishClient', () => {
  it('initializes via UCI handshake then resolves bestMove', async () => {
    const fake = new FakeStockfishWorker();
    const client = new StockfishClient(() => fake as unknown as Worker);
    await client.init();
    fake.bestmoveResponse = 'bestmove e7e5';
    const move = await client.bestMove({
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      skill: 10,
      movetimeMs: 100,
    });
    expect(move).toEqual({ from: 'e7', to: 'e5', promotion: undefined });
  });

  it('parses promotions in bestmove', async () => {
    const fake = new FakeStockfishWorker();
    const client = new StockfishClient(() => fake as unknown as Worker);
    await client.init();
    fake.bestmoveResponse = 'bestmove e7e8q';
    const move = await client.bestMove({
      fen: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
      skill: 1,
      movetimeMs: 50,
    });
    expect(move).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });

  it('terminate releases listeners', async () => {
    const fake = new FakeStockfishWorker();
    const client = new StockfishClient(() => fake as unknown as Worker);
    await client.init();
    client.terminate();
    expect(() => client.terminate()).not.toThrow();
  });
});
