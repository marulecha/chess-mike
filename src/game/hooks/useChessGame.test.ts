import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from './useChessGame';

describe('useChessGame', () => {
  it('starts in the standard position with white to move', () => {
    const { result } = renderHook(() => useChessGame());
    expect(result.current.turn).toBe('w');
    expect(result.current.status).toBe('idle');
    expect(result.current.history).toHaveLength(0);
    expect(result.current.fen.startsWith('rnbqkbnr/pppppppp')).toBe(true);
  });

  it('plays a legal move and updates turn', () => {
    const { result } = renderHook(() => useChessGame());
    let ok = false;
    act(() => { ok = result.current.move('e2', 'e4'); });
    expect(ok).toBe(true);
    expect(result.current.turn).toBe('b');
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].san).toBe('e4');
    expect(result.current.status).toBe('in-progress');
  });

  it('rejects illegal moves', () => {
    const { result } = renderHook(() => useChessGame());
    let ok = true;
    act(() => { ok = result.current.move('e2', 'e5'); });
    expect(ok).toBe(false);
    expect(result.current.history).toHaveLength(0);
  });

  it('returns legal moves from a square', () => {
    const { result } = renderHook(() => useChessGame());
    const moves = result.current.legalMovesFrom('e2');
    expect(moves.sort()).toEqual(['e3', 'e4']);
  });

  it("detects fool's mate", () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.move('f2', 'f3'); });
    act(() => { result.current.move('e7', 'e5'); });
    act(() => { result.current.move('g2', 'g4'); });
    act(() => { result.current.move('d8', 'h4'); });
    expect(result.current.status).toBe('checkmate');
  });

  it('undoes the last move', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.move('e2', 'e4'); });
    act(() => { result.current.undo(); });
    expect(result.current.turn).toBe('w');
    expect(result.current.history).toHaveLength(0);
  });

  it('loads a PGN', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.loadPgn('1. e4 e5 2. Nf3 Nc6'); });
    expect(result.current.history).toHaveLength(4);
    expect(result.current.turn).toBe('w');
  });

  it('marks resigned status and tracks resigning color', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.resign('w'); });
    expect(result.current.status).toBe('resigned');
    expect(result.current.resignedColor).toBe('w');
  });

  it('markDisconnect sets disconnect status and tracks loser', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.markDisconnect('b'); });
    expect(result.current.status).toBe('disconnect');
    expect(result.current.resignedColor).toBe('b');
  });

  it('markRemoteResign sets resigned status with peer color', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.markRemoteResign('b'); });
    expect(result.current.status).toBe('resigned');
    expect(result.current.resignedColor).toBe('b');
  });

  it('a new move clears resignedColor and override', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.resign('w'); });
    expect(result.current.resignedColor).toBe('w');
    act(() => { result.current.reset(); });
    act(() => { result.current.move('e2', 'e4'); });
    expect(result.current.resignedColor).toBeNull();
    expect(result.current.status).toBe('in-progress');
  });
});
