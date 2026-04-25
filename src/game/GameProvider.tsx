import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useChessGame, type UseChessGameApi } from './hooks/useChessGame';
import { useTimer, type UseTimerApi } from './hooks/useTimer';
import { useStockfish, type UseStockfishApi, type UseStockfishOptions } from './hooks/useStockfish';
import { usePersistence, type UsePersistenceApi } from './hooks/usePersistence';
import { useOnlineGame, type UseOnlineGameApi, type RoomFactory } from './online/useOnlineGame';
import { DEFAULT_SETTINGS, type GameSettings } from '../types/chess';

export type GameContextValue = {
  game: UseChessGameApi;
  timer: UseTimerApi;
  stockfish: UseStockfishApi;
  persistence: UsePersistenceApi;
  settings: GameSettings;
  setSettings: (next: GameSettings) => void;
  online: UseOnlineGameApi | null;
};

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

type Props = {
  children: ReactNode;
  initialSettings?: GameSettings;
  stockfishOptions?: UseStockfishOptions;
  roomFactory?: RoomFactory;
};

export function GameProvider({ children, initialSettings = DEFAULT_SETTINGS, stockfishOptions, roomFactory }: Props) {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);

  const game = useChessGame();
  const timer = useTimer(
    settings.timeControl ?? { initialMs: 5 * 60 * 1000, incrementMs: 0 },
    (loser) => game.markTimeout(loser),
  );
  const stockfish = useStockfish(stockfishOptions);
  const persistence = usePersistence();

  // Auto-save: skip in online mode
  useEffect(() => {
    if (settings.mode === 'two-players-online') return;
    if (game.history.length === 0) return;
    persistence.save({
      pgn: game.pgn,
      settings,
      clock: { whiteMs: timer.whiteMs, blackMs: timer.blackMs },
    });
    if (game.status !== 'in-progress' && game.status !== 'idle') persistence.clear();
  }, [game.pgn, game.status, game.history.length, settings, timer.whiteMs, timer.blackMs, persistence]);

  const baseValue = useMemo(() => ({
    game, timer, stockfish, persistence, settings, setSettings,
  }), [game, timer, stockfish, persistence, settings]);

  if (settings.mode === 'two-players-online' && settings.online && roomFactory) {
    return (
      <OnlineHost config={settings.online} roomFactory={roomFactory} baseValue={baseValue}>
        {children}
      </OnlineHost>
    );
  }

  const value: GameContextValue = { ...baseValue, online: null };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

function OnlineHost({
  config, roomFactory, baseValue, children,
}: {
  config: NonNullable<GameSettings['online']>;
  roomFactory: RoomFactory;
  baseValue: Omit<GameContextValue, 'online'>;
  children: ReactNode;
}) {
  const online = useOnlineGame({
    role: config.role,
    code: config.code,
    hostInit: config.hostInit,
    roomFactory,
  });
  const value: GameContextValue = { ...baseValue, online };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
