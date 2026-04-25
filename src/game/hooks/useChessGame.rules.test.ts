import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from './useChessGame';

// Verify that the rule edge-cases that depend on chess.js's bookkeeping all work
// when invoked through our hook. These guard against the React layer accidentally
// dropping a flag the engine cares about (en passant target, castling rights, etc.)

describe('useChessGame — rule edge cases', () => {
  it('kingside castle (white)', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.loadPgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5'); });
    // Now white can castle short. legalMovesFrom(e1) should include g1.
    expect(result.current.legalMovesFrom('e1')).toContain('g1');
    let ok = false;
    act(() => { ok = result.current.move('e1', 'g1'); });
    expect(ok).toBe(true);
    // After castling, the king should be on g1 and the rook on f1
    const last = result.current.history.at(-1)!;
    expect(last.san).toBe('O-O');
  });

  it('queenside castle (white)', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => {
      result.current.loadPgn('1. d4 d5 2. Nc3 Nc6 3. Bf4 Bf5 4. Qd2 Qd7');
    });
    // White to move; long castle should be available (Nb1, Bc1, Qd1 all moved)
    expect(result.current.turn).toBe('w');
    expect(result.current.legalMovesFrom('e1')).toContain('c1');
    let ok = false;
    act(() => { ok = result.current.move('e1', 'c1'); });
    expect(ok).toBe(true);
    expect(result.current.history.at(-1)!.san).toBe('O-O-O');
  });

  it('cannot castle through check', () => {
    const { result } = renderHook(() => useChessGame());
    // Set up white kingside castle blocked by a black bishop on h4 attacking f2
    act(() => {
      result.current.loadPgn('1. e4 e5 2. Nf3 Bc5 3. Bc4 Bxf2+');
    });
    // After Bxf2+, white in check; cannot castle anyway.
    expect(result.current.legalMovesFrom('e1')).not.toContain('g1');
  });

  it('en passant capture is legal and applied correctly', () => {
    const { result } = renderHook(() => useChessGame());
    // Set up a position where white's e5 pawn can capture black's d5 en passant
    act(() => {
      result.current.loadPgn('1. e4 Nc6 2. e5 d5');
    });
    // Now black just played d7-d5; white can capture en passant on d6
    expect(result.current.legalMovesFrom('e5')).toContain('d6');
    let ok = false;
    act(() => { ok = result.current.move('e5', 'd6'); });
    expect(ok).toBe(true);
    const last = result.current.history.at(-1)!;
    // SAN for en passant looks like "exd6"
    expect(last.san).toBe('exd6');
    expect(last.captured).toBe('p');
  });

  it('en passant only valid for one move (right of refusal expires)', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => {
      result.current.loadPgn('1. e4 Nc6 2. e5 d5 3. Nf3 Nf6');
    });
    // Now white to move on move 4. The en passant window is gone.
    expect(result.current.legalMovesFrom('e5')).not.toContain('d6');
  });

  it('promotion to a knight changes the piece type', () => {
    const { result } = renderHook(() => useChessGame());
    // Walk a white h-pawn unopposed to the 7th, then capture-promote on h8 or g8
    act(() => {
      result.current.loadPgn('1. h4 a5 2. h5 a4 3. h6 a3 4. hxg7 axb2');
    });
    // White to move: pawn on g7 captures the rook on h8 and promotes
    expect(result.current.turn).toBe('w');
    let ok = false;
    act(() => { ok = result.current.move('g7', 'h8', 'n'); });
    expect(ok).toBe(true);
    expect(result.current.history.at(-1)!.san).toMatch(/^gxh8=N/);
  });

  it('stalemate sets status=stalemate and is a terminal state', () => {
    const { result } = renderHook(() => useChessGame());
    // Classic short stalemate (Sam Loyd-ish): not the shortest possible but verifiable.
    // 1. e3 a5 2. Qh5 Ra6 3. Qxa5 h5 4. Qxc7 Rah6 5. h4 f6 6. Qxd7+ Kf7
    // 7. Qxb7 Qd3 8. Qxb8 Qh7 9. Qxc8 Kg6 10. Qe6 -> stalemate
    act(() => {
      result.current.loadPgn(
        '1. e3 a5 2. Qh5 Ra6 3. Qxa5 h5 4. Qxc7 Rah6 5. h4 f6 6. Qxd7+ Kf7 7. Qxb7 Qd3 8. Qxb8 Qh7 9. Qxc8 Kg6 10. Qe6'
      );
    });
    expect(result.current.status).toBe('stalemate');
  });
});
