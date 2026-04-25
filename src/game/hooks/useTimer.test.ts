import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useTimer', () => {
  it('starts paused with full time on both sides', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 60_000, incrementMs: 0 }));
    expect(result.current.whiteMs).toBe(60_000);
    expect(result.current.blackMs).toBe(60_000);
    expect(result.current.runningSide).toBeNull();
  });

  it('decrements the running side over time', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 60_000, incrementMs: 0 }));
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(2_000); });
    expect(result.current.whiteMs).toBeLessThanOrEqual(58_100);
    expect(result.current.whiteMs).toBeGreaterThanOrEqual(57_900);
    expect(result.current.blackMs).toBe(60_000);
  });

  it('switches sides and applies increment on press', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 60_000, incrementMs: 5_000 }));
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(3_000); });
    act(() => { result.current.press(); });
    expect(result.current.runningSide).toBe('b');
    expect(result.current.whiteMs).toBeGreaterThanOrEqual(61_900);
  });

  it('flags a side at zero', () => {
    const onFlag = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ initialMs: 1_000, incrementMs: 0 }, onFlag),
    );
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(1_500); });
    expect(result.current.whiteMs).toBe(0);
    expect(onFlag).toHaveBeenCalledWith('w');
    expect(result.current.runningSide).toBeNull();
  });

  it('reset returns clocks to initial', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 30_000, incrementMs: 0 }));
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(5_000); });
    act(() => { result.current.reset(); });
    expect(result.current.whiteMs).toBe(30_000);
    expect(result.current.runningSide).toBeNull();
  });
});
