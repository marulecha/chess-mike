import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess, type Move } from 'chess.js';
import type { Color, GameStatus, Promotion, Square } from '../../types/chess';

export type UseChessGameApi = {
  fen: string;
  pgn: string;
  history: Move[];
  turn: Color;
  inCheck: boolean;
  status: GameStatus;
  move: (from: Square, to: Square, promotion?: Promotion) => boolean;
  legalMovesFrom: (square: Square) => Square[];
  undo: () => void;
  reset: () => void;
  resign: (color: Color) => void;
  loadPgn: (pgn: string) => boolean;
  markTimeout: (loser: Color) => void;
  markDisconnect: (loser: Color) => void;
  markRemoteResign: () => void;
};

function deriveStatus(chess: Chess, override?: GameStatus): GameStatus {
  if (override) return override;
  if (chess.history().length === 0) return 'idle';
  if (chess.isCheckmate()) return 'checkmate';
  if (chess.isStalemate()) return 'stalemate';
  if (chess.isDraw()) return 'draw';
  return 'in-progress';
}

export function useChessGame(): UseChessGameApi {
  const chessRef = useRef(new Chess());
  const [tick, setTick] = useState(0);
  const [override, setOverride] = useState<GameStatus | undefined>(undefined);

  const bump = () => setTick((t) => t + 1);

  const move = useCallback((from: Square, to: Square, promotion?: Promotion): boolean => {
    try {
      const result = chessRef.current.move({ from, to, promotion });
      if (!result) return false;
      setOverride(undefined);
      bump();
      return true;
    } catch {
      return false;
    }
  }, []);

  const legalMovesFrom = useCallback((square: Square): Square[] => {
    return chessRef.current.moves({ square, verbose: true }).map((m) => m.to as Square);
  }, []);

  const undo = useCallback(() => {
    chessRef.current.undo();
    setOverride(undefined);
    bump();
  }, []);

  const reset = useCallback(() => {
    chessRef.current = new Chess();
    setOverride(undefined);
    bump();
  }, []);

  const resign = useCallback((_color: Color) => {
    setOverride('resigned');
    bump();
  }, []);

  const markTimeout = useCallback((_loser: Color) => {
    setOverride('timeout');
    bump();
  }, []);

  const markDisconnect = useCallback((_loser: Color) => {
    setOverride('disconnect');
    bump();
  }, []);

  const markRemoteResign = useCallback(() => {
    setOverride('resigned');
    bump();
  }, []);

  const loadPgn = useCallback((pgn: string): boolean => {
    try {
      const next = new Chess();
      next.loadPgn(pgn);
      chessRef.current = next;
      setOverride(undefined);
      bump();
      return true;
    } catch {
      return false;
    }
  }, []);

  return useMemo(() => {
    const chess = chessRef.current;
    return {
      fen: chess.fen(),
      pgn: chess.pgn(),
      history: chess.history({ verbose: true }) as Move[],
      turn: chess.turn() as Color,
      inCheck: chess.inCheck(),
      status: deriveStatus(chess, override),
      move,
      legalMovesFrom,
      undo,
      reset,
      resign,
      loadPgn,
      markTimeout,
      markDisconnect,
      markRemoteResign,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, override, move, legalMovesFrom, undo, reset, resign, loadPgn, markTimeout, markDisconnect, markRemoteResign]);
}
