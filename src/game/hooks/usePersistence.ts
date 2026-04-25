import { useCallback, useMemo } from 'react';
import type { GameSettings } from '../../types/chess';

export const SAVE_KEY = 'michalis-chess-master:save-v1';
export const PREFS_KEY = 'michalis-chess-master:prefs-v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type SaveBlob = {
  pgn: string;
  settings: GameSettings;
  clock: { whiteMs: number; blackMs: number };
};

export type LoadedSave = SaveBlob & { savedAt: number };

export type UsePersistenceApi = {
  save: (blob: SaveBlob) => void;
  load: () => LoadedSave | null;
  clear: () => void;
  savePrefs: (prefs: Partial<GameSettings>) => void;
  loadPrefs: () => Partial<GameSettings> | null;
};

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function usePersistence(): UsePersistenceApi {
  const save = useCallback((blob: SaveBlob) => {
    const payload: LoadedSave = { ...blob, savedAt: Date.now() };
    safeSet(SAVE_KEY, JSON.stringify(payload));
  }, []);

  const load = useCallback((): LoadedSave | null => {
    const raw = safeGet(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as LoadedSave;
      if (typeof parsed.savedAt !== 'number') return null;
      if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const clear = useCallback(() => safeRemove(SAVE_KEY), []);

  const savePrefs = useCallback((prefs: Partial<GameSettings>) => {
    safeSet(PREFS_KEY, JSON.stringify(prefs));
  }, []);

  const loadPrefs = useCallback((): Partial<GameSettings> | null => {
    const raw = safeGet(PREFS_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, []);

  return useMemo(() => ({ save, load, clear, savePrefs, loadPrefs }),
    [save, load, clear, savePrefs, loadPrefs]);
}
