import { useEffect, useState } from 'react';
import { GameProvider, useGame } from '../game/GameProvider';
import { ImperialFrame } from '../components/ImperialFrame';
import { Board } from '../components/Board';
import { PlayerCard } from '../components/PlayerCard';
import { MoveHistory } from '../components/MoveHistory';
import { ControlsPanel } from '../components/ControlsPanel';
import { AIThinkingIndicator } from '../components/AIThinkingIndicator';
import { SetupModal } from '../components/SetupModal';
import { ResumeBanner } from '../components/ResumeBanner';
import { GameOverDialog } from '../components/GameOverDialog';
import { ToastHost, showToast } from '../components/Toast';
import { DEFAULT_SETTINGS, type GameSettings } from '../types/chess';
import { usePersistence, type LoadedSave } from '../game/hooks/usePersistence';
import { realRoomFactory } from '../game/online/trystero-adapter';
import { OnlineMoveBridge } from '../game/online/OnlineMoveBridge';

export default function PlayPage() {
  const persistence = usePersistence();
  const [showSetup, setShowSetup] = useState(true);
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(persistence.loadPrefs() ?? {}),
  }));
  const [resumeOffer, setResumeOffer] = useState<LoadedSave | null>(persistence.load());

  return (
    <main className="min-h-screen p-4 md:p-6">
      <GameProvider key={JSON.stringify(settings)} initialSettings={settings} roomFactory={realRoomFactory}>
        <PlayPageInner
          showSetup={showSetup}
          openSetup={() => setShowSetup(true)}
          closeSetup={() => setShowSetup(false)}
          confirmSetup={(s) => {
            setSettings(s);
            persistence.savePrefs(s);
            setShowSetup(false);
            setResumeOffer(null);
          }}
          resumeOffer={resumeOffer}
          onResume={() => {
            if (resumeOffer) {
              setSettings(resumeOffer.settings);
              setResumeOffer(null);
              setShowSetup(false);
            }
          }}
          onDiscard={() => { persistence.clear(); setResumeOffer(null); }}
          flipBoard={() => setSettings((s) => ({
            ...s,
            boardOrientation: s.boardOrientation === 'white' ? 'black' : 'white',
          }))}
        />
      </GameProvider>
      <ToastHost />
    </main>
  );
}

type InnerProps = {
  showSetup: boolean;
  openSetup: () => void;
  closeSetup: () => void;
  confirmSetup: (s: GameSettings) => void;
  resumeOffer: LoadedSave | null;
  onResume: () => void;
  onDiscard: () => void;
  flipBoard: () => void;
};

function PlayPageInner({
  showSetup, openSetup, closeSetup, confirmSetup,
  resumeOffer, onResume, onDiscard, flipBoard,
}: InnerProps) {
  const { game, timer, stockfish, settings, online } = useGame();

  // Resume effect: load PGN once after mount if there's a pending resume offer
  useEffect(() => {
    if (!resumeOffer) return;
    game.loadPgn(resumeOffer.pgn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stockfish unavailability toast
  useEffect(() => {
    if (stockfish.unavailable && settings.mode === 'human-vs-ai') {
      showToast("The Emperor's strategist is unavailable; switch to Two Players.");
    }
  }, [stockfish.unavailable, settings.mode]);

  // Drive AI moves
  useEffect(() => {
    if (settings.mode !== 'human-vs-ai') return;
    if (game.status !== 'in-progress' && game.status !== 'idle') return;
    const aiColor = settings.playerColor === 'white' ? 'b' : 'w';
    if (game.turn !== aiColor) return;
    if (!stockfish.ready) return;
    let cancelled = false;
    stockfish.requestMove(game.fen, settings.aiDifficulty)
      .then((mv) => {
        if (cancelled) return;
        const ok = game.move(mv.from, mv.to, mv.promotion);
        if (!ok) showToast('AI returned an unexpected move. Please start a new game.');
      })
      .catch(() => { if (!cancelled) showToast('AI error. Please start a new game.'); });
    return () => { cancelled = true; };
  }, [game.fen, game.turn, game.status, settings.mode, settings.playerColor, settings.aiDifficulty, stockfish.ready]);

  // Drive clock alongside moves
  useEffect(() => {
    if (!settings.timeControl) return;
    if (game.status === 'idle') {
      if (timer.runningSide === null) timer.start('w');
      return;
    }
    if (game.status !== 'in-progress') { timer.pause(); return; }
    if (timer.runningSide === null) timer.start(game.turn);
    else if (timer.runningSide !== game.turn) timer.press();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.history.length, game.status]);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      // Allow modifiers only for Esc
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === 'Escape') {
        if (showSetup) closeSetup();
        return;
      }
      if (showSetup) return; // most shortcuts inactive while modal open

      const k = e.key.toLowerCase();
      if (k === 'n') { e.preventDefault(); openSetup(); return; }
      if (k === 'f') { e.preventDefault(); flipBoard(); return; }
      if (k === 'u') {
        e.preventDefault();
        const isAI = settings.mode === 'human-vs-ai';
        const isOnline = settings.mode === 'two-players-online';
        if (isOnline) return;
        if (isAI) {
          const last = game.history.at(-1);
          const lastWasAI = last && last.color !== (settings.playerColor === 'white' ? 'w' : 'b');
          game.undo();
          if (lastWasAI) game.undo();
        } else {
          game.undo();
        }
        return;
      }
      if (k === 'r') {
        e.preventDefault();
        if (game.status !== 'in-progress') return;
        game.resign(game.turn);
        if (settings.mode === 'two-players-online' && online) online.sendResign();
        return;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSetup, openSetup, closeSetup, flipBoard, settings, game, online]);

  const winnerLabel = (() => {
    const colorWord = (c: 'w' | 'b' | null) => c === 'w' ? 'White' : c === 'b' ? 'Black' : '';
    if (game.status === 'checkmate') return `${game.turn === 'w' ? 'Black' : 'White'} delivers mate.`;
    if (game.status === 'resigned') {
      const loser = game.resignedColor ?? game.turn;
      const winner = loser === 'w' ? 'Black' : 'White';
      return `${colorWord(loser)} resigns. ${winner} wins.`;
    }
    if (game.status === 'timeout') {
      const loser = game.resignedColor ?? game.turn;
      return `${colorWord(loser)} ran out of time.`;
    }
    if (game.status === 'disconnect') return 'Opponent forfeited (disconnected).';
    if (game.status === 'stalemate') return 'Stalemate.';
    if (game.status === 'draw') return 'Draw by rule.';
    return '';
  })();

  // Top label depending on board orientation: the player whose pieces sit at
  // the top of the board is shown in the top panel.
  const topColor = settings.boardOrientation === 'white' ? 'b' : 'w';
  const bottomColor = topColor === 'w' ? 'b' : 'w';

  return (
    <>
      <OnlineMoveBridge />
      {resumeOffer && !showSetup && (
        <div className="max-w-3xl mx-auto mb-4">
          <ResumeBanner savedAt={resumeOffer.savedAt} onResume={onResume} onDiscard={onDiscard} />
        </div>
      )}
      <ImperialFrame>
        {/* Mobile-first: top player → board → bottom player → controls/moves.
            On lg+: 3-column desktop layout. */}
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:gap-6 lg:items-start flex flex-col gap-4">
          {/* Mobile top: opponent player card */}
          <aside className="lg:hidden">
            <PlayerCard color={topColor} />
          </aside>
          {/* Desktop left column */}
          <aside className="hidden lg:flex flex-col gap-4">
            <PlayerCard color={topColor} />
            <MoveHistory />
          </aside>
          {/* Board (centre on all sizes) */}
          <div className="flex justify-center">
            <Board />
          </div>
          {/* Mobile bottom: own player card, then controls + history + AI indicator */}
          <aside className="lg:hidden flex flex-col gap-3">
            <PlayerCard color={bottomColor} />
            <ControlsPanel />
            <AIThinkingIndicator />
            <MoveHistory />
          </aside>
          {/* Desktop right column */}
          <aside className="hidden lg:flex flex-col gap-4">
            <PlayerCard color={bottomColor} />
            <ControlsPanel />
            <AIThinkingIndicator />
          </aside>
        </div>
      </ImperialFrame>

      <KeyboardHintFooter />

      {showSetup && (
        <SetupModal
          initial={settings}
          aiAvailable={!stockfish.unavailable}
          onConfirm={confirmSetup}
          onClose={closeSetup}
        />
      )}

      <GameOverDialog
        status={game.status}
        winnerLabel={winnerLabel}
        onNewGame={openSetup}
        onClose={() => {}}
      />
    </>
  );
}

function KeyboardHintFooter() {
  return (
    <div
      data-testid="kbd-hint"
      className="mt-4 flex justify-center gap-3 font-mono text-imperial-cream/35 text-[0.6rem] tracking-[0.3em] uppercase"
    >
      <Key>Esc</Key>
      <Key>N</Key>
      <Key>F</Key>
      <Key>U</Key>
      <Key>R</Key>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-0.5 border border-imperial-cream/15 rounded-sm">{children}</span>
  );
}
