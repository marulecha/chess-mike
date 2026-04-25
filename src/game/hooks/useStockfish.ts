import { useCallback, useEffect, useRef, useState } from 'react';
import { StockfishClient, defaultWorkerFactory, type BestMoveResult, type WorkerFactory } from '../stockfish/worker-client';
import { difficultyToConfig } from '../stockfish/difficulty';
import type { Difficulty } from '../../types/chess';

export type UseStockfishOptions = { factory?: WorkerFactory };

export type UseStockfishApi = {
  ready: boolean;
  unavailable: boolean;
  aiThinking: boolean;
  requestMove: (fen: string, difficulty: Difficulty) => Promise<BestMoveResult>;
};

export function useStockfish(opts: UseStockfishOptions = {}): UseStockfishApi {
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const clientRef = useRef<StockfishClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const factory = opts.factory ?? defaultWorkerFactory;
    let client: StockfishClient;
    try {
      client = new StockfishClient(factory);
    } catch {
      setUnavailable(true);
      return;
    }
    clientRef.current = client;
    client.init().then(
      () => { if (!cancelled) setReady(true); },
      () => { if (!cancelled) setUnavailable(true); },
    );
    return () => {
      cancelled = true;
      client.terminate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMove = useCallback(async (fen: string, difficulty: Difficulty) => {
    if (!clientRef.current) throw new Error('stockfish not ready');
    const cfg = difficultyToConfig(difficulty);
    setAiThinking(true);
    try {
      return await clientRef.current.bestMove({ fen, skill: cfg.skill, movetimeMs: cfg.movetimeMs });
    } finally {
      setAiThinking(false);
    }
  }, []);

  return { ready, unavailable, aiThinking, requestMove };
}
