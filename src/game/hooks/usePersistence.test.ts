import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistence, SAVE_KEY } from './usePersistence';
import { DEFAULT_SETTINGS } from '../../types/chess';

beforeEach(() => { localStorage.clear(); });

describe('usePersistence', () => {
  it('returns null when nothing is saved', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current.load()).toBeNull();
  });

  it('round-trips a save', () => {
    const { result } = renderHook(() => usePersistence());
    act(() => {
      result.current.save({
        pgn: '1. e4 e5',
        settings: DEFAULT_SETTINGS,
        clock: { whiteMs: 1000, blackMs: 1000 },
      });
    });
    const loaded = result.current.load();
    expect(loaded?.pgn).toBe('1. e4 e5');
    expect(loaded?.settings.mode).toBe(DEFAULT_SETTINGS.mode);
    expect(loaded?.savedAt).toBeTypeOf('number');
  });

  it('clears the save', () => {
    const { result } = renderHook(() => usePersistence());
    act(() => {
      result.current.save({
        pgn: '1. e4',
        settings: DEFAULT_SETTINGS,
        clock: { whiteMs: 1000, blackMs: 1000 },
      });
    });
    act(() => { result.current.clear(); });
    expect(result.current.load()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    const { result } = renderHook(() => usePersistence());
    expect(result.current.load()).toBeNull();
  });

  it('rejects saves older than 7 days', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      pgn: '1. e4',
      settings: DEFAULT_SETTINGS,
      clock: { whiteMs: 1000, blackMs: 1000 },
      savedAt: eightDaysAgo,
    }));
    const { result } = renderHook(() => usePersistence());
    expect(result.current.load()).toBeNull();
  });

  it('swallows quota errors silently', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); };
    const { result } = renderHook(() => usePersistence());
    expect(() => act(() => {
      result.current.save({
        pgn: '1. e4',
        settings: DEFAULT_SETTINGS,
        clock: { whiteMs: 1000, blackMs: 1000 },
      });
    })).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
