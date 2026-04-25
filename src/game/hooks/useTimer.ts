import { useCallback, useEffect, useRef, useState } from 'react';
import type { Color } from '../../types/chess';

export type TimeControl = { initialMs: number; incrementMs: number };

export type UseTimerApi = {
  whiteMs: number;
  blackMs: number;
  runningSide: Color | null;
  start: (side: Color) => void;
  press: () => void;
  pause: () => void;
  reset: () => void;
};

const TICK_MS = 100;

export function useTimer(
  control: TimeControl,
  onFlag?: (loser: Color) => void,
): UseTimerApi {
  const [whiteMs, setWhiteMs] = useState(control.initialMs);
  const [blackMs, setBlackMs] = useState(control.initialMs);
  const [runningSide, setRunningSide] = useState<Color | null>(null);

  // Mirror state in refs so the interval tick can read the *current* values
  // synchronously without relying on React's potentially deferred updater calls.
  const whiteMsRef = useRef(control.initialMs);
  const blackMsRef = useRef(control.initialMs);
  const runningSideRef = useRef<Color | null>(null);

  const lastTickRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFlagRef = useRef(onFlag);
  onFlagRef.current = onFlag;

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastTickRef.current = null;
  };

  const setRunning = (side: Color | null) => {
    runningSideRef.current = side;
    setRunningSide(side);
  };

  const setSideMs = (side: Color, value: number) => {
    if (side === 'w') {
      whiteMsRef.current = value;
      setWhiteMs(value);
    } else {
      blackMsRef.current = value;
      setBlackMs(value);
    }
  };

  const tick = useCallback(() => {
    const side = runningSideRef.current;
    if (!side) return;
    const now = Date.now();
    const last = lastTickRef.current ?? now;
    const delta = now - last;
    lastTickRef.current = now;
    const current = side === 'w' ? whiteMsRef.current : blackMsRef.current;
    const next = Math.max(0, current - delta);
    setSideMs(side, next);
    if (next === 0 && current > 0) {
      stopInterval();
      setRunning(null);
      onFlagRef.current?.(side);
    }
  }, []);

  useEffect(() => () => stopInterval(), []);

  const start = useCallback((side: Color) => {
    stopInterval();
    setRunning(side);
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const press = useCallback(() => {
    const side = runningSideRef.current;
    if (!side) return;
    const current = side === 'w' ? whiteMsRef.current : blackMsRef.current;
    setSideMs(side, current + control.incrementMs);
    const next: Color = side === 'w' ? 'b' : 'w';
    lastTickRef.current = Date.now();
    setRunning(next);
  }, [control.incrementMs]);

  const pause = useCallback(() => {
    stopInterval();
    setRunning(null);
  }, []);

  const reset = useCallback(() => {
    stopInterval();
    whiteMsRef.current = control.initialMs;
    blackMsRef.current = control.initialMs;
    setWhiteMs(control.initialMs);
    setBlackMs(control.initialMs);
    setRunning(null);
  }, [control.initialMs]);

  return { whiteMs, blackMs, runningSide, start, press, pause, reset };
}
