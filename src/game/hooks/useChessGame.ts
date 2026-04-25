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
  resignedColor: Color | null;        // who resigned (or timed out / disconnected)
  move: (from: Square, to: Square, promotion?: Promotion) => boolean;
  legalMovesFrom: (square: Square) => Square[];
  undo: () => void;
  reset: () => void;
  resign: (color: Color) => void;
  loadPgn: (pgn: string) => boolean;
  markTimeout: (loser: Color) => void;
  markDisconnect: (loser: Color) => void;
  markRemoteResign: (color: Color) => void;   // takes the resigning color now
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
  const [resignedColor, setResignedColor] = useState<Color | null>(null);

  const bump = () => setTick((t) => t + 1);

  const move = useCallback((from: Square, to: Square, promotion?: Promotion): boolean => {
    try {
      const result = chessRef.current.move({ from, to, promotion });
      if (!result) return false;
      setOverride(undefined);
      setResignedColor(null);
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
    setResignedColor(null);
    bump();
  }, []);

  const reset = useCallback(() => {
    chessRef.current = new Chess();
    setOverride(undefined);
    setResignedColor(null);
    bump();
  }, []);

  const resign = useCallback((color: Color) => {
    setOverride('resigned');
    setResignedColor(color);
    bump();
  }, []);

  const markTimeout = useCallback((loser: Color) => {
    setOverride('timeout');
    setResignedColor(loser);
    bump();
  }, []);

  const markDisconnect = useCallback((loser: Color) => {
    setOverride('disconnect');
    setResignedColor(loser);
    bump();
  }, []);

  const markRemoteResign = useCallback((color: Color) => {
    setOverride('resigned');
    setResignedColor(color);
    bump();
  }, []);

  const loadPgn = useCallback((pgn: string): boolean => {
    try {
      const next = new Chess();
      next.loadPgn(pgn);
      chessRef.current = next;
      setOverride(undefined);
      setResignedColor(null);
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
      resignedColor,
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
  }, [tick, override, resignedColor, move, legalMovesFrom, undo, reset, resign, loadPgn, markTimeout, markDisconnect, markRemoteResign]);
}
