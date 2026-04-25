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

export default function PlayPage() {
  const persistence = usePersistence();
  const [showSetup, setShowSetup] = useState(true);
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(persistence.loadPrefs() ?? {}),
  }));
  const [resumeOffer, setResumeOffer] = useState<LoadedSave | null>(persistence.load());

  return (
    <main className="min-h-screen p-6">
      <GameProvider key={JSON.stringify(settings)} initialSettings={settings}>
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
};

function PlayPageInner({ showSetup, openSetup, closeSetup, confirmSetup, resumeOffer, onResume, onDiscard }: InnerProps) {
  const { game, timer, stockfish, settings } = useGame();

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
    if (game.status !== 'in-progress') { timer.pause(); return; }
    if (timer.runningSide === null) timer.start(game.turn);
    else if (timer.runningSide !== game.turn) timer.press();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.history.length, game.status]);

  const winnerLabel = (() => {
    if (game.status === 'checkmate') return `${game.turn === 'w' ? 'Black' : 'White'} delivers mate.`;
    if (game.status === 'resigned') return `${game.turn === 'w' ? 'White' : 'Black'} resigns.`;
    if (game.status === 'timeout') return `${game.turn === 'w' ? 'White' : 'Black'} ran out of time.`;
    if (game.status === 'stalemate') return 'Stalemate.';
    if (game.status === 'draw') return 'Draw by rule.';
    return '';
  })();

  return (
    <>
      {resumeOffer && !showSetup && (
        <div className="max-w-3xl mx-auto mb-4">
          <ResumeBanner savedAt={resumeOffer.savedAt} onResume={onResume} onDiscard={onDiscard} />
        </div>
      )}
      <ImperialFrame>
        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_260px] gap-6 items-start">
          <aside className="flex flex-col gap-4">
            <PlayerCard color="b" />
            <MoveHistory />
          </aside>
          <div className="flex justify-center">
            <Board />
          </div>
          <aside className="flex flex-col gap-4">
            <PlayerCard color="w" />
            <ControlsPanel />
            <AIThinkingIndicator />
          </aside>
        </div>
      </ImperialFrame>

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
