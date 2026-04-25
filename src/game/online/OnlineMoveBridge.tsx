import { useEffect, useRef } from 'react';
import { useGame } from '../GameProvider';
import { showToast } from '../../components/Toast';

export function OnlineMoveBridge() {
  const { game, online } = useGame();
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    if (!online) return;
    const g = () => gameRef.current;
    const offMove = online.onMove((m) => g().move(m.from, m.to, m.promotion));
    const offResign = online.onResign(() => g().markRemoteResign());
    let forfeitTimer: ReturnType<typeof setTimeout> | null = null;
    const offLeave = online.onPeerLeave(() => {
      showToast('Opponent disconnected — they forfeit in 30s…');
      forfeitTimer = setTimeout(() => {
        const opponent = online.myColor === 'w' ? 'b' : 'w';
        g().markDisconnect(opponent);
      }, 30_000);
    });
    const offJoin = online.onPeerJoin(() => {
      if (forfeitTimer) { clearTimeout(forfeitTimer); forfeitTimer = null; }
      online.sendResync(g().fen, g().pgn);
    });
    const offResync = online.onResync((m) => {
      if (m.fen !== g().fen) {
        g().loadPgn(m.pgn);
        showToast('Game state synchronized with opponent.');
      }
    });
    return () => {
      offMove(); offResign(); offLeave(); offJoin(); offResync();
      if (forfeitTimer) clearTimeout(forfeitTimer);
    };
  }, [online]);

  return null;
}
