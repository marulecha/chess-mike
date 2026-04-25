import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Promotion, Square } from '../../types/chess';
import type { FakeRoom } from '../../test/mocks/fake-trystero';
import type { Hello, TimeControl, WireMove, WireResign, WireResync } from './protocol';

export type OnlineRole = 'host' | 'join';
export type OnlineStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'closed';

export type HostInit = {
  color: 'white' | 'black' | 'random';
  timeControl: TimeControl | null;
};

export type RoomFactory = (roomName: string) => FakeRoom;

export type UseOnlineGameOptions = {
  role: OnlineRole;
  code: string;
  hostInit?: HostInit;
  roomFactory: RoomFactory;
};

export type UseOnlineGameApi = {
  status: OnlineStatus;
  myColor: 'w' | 'b' | null;
  timeControl: TimeControl | null;
  sendMove: (m: { from: Square; to: Square; promotion?: Promotion }) => void;
  sendResign: () => void;
  sendResync: (fen: string, pgn: string) => void;
  onMove: (cb: (m: WireMove) => void) => () => void;
  onResign: (cb: () => void) => () => void;
  onResync: (cb: (m: WireResync) => void) => () => void;
  onPeerLeave: (cb: () => void) => () => void;
  onPeerJoin: (cb: () => void) => () => void;
  close: () => void;
};

const ROOM_PREFIX = 'michalis-chess-master:';

function pickHostColor(choice: 'white' | 'black' | 'random'): 'w' | 'b' {
  if (choice === 'white') return 'w';
  if (choice === 'black') return 'b';
  return Math.random() < 0.5 ? 'w' : 'b';
}

export function useOnlineGame(opts: UseOnlineGameOptions): UseOnlineGameApi {
  const { role, code, hostInit, roomFactory } = opts;

  const [status, setStatus] = useState<OnlineStatus>(role === 'host' ? 'waiting' : 'connecting');
  const [myColor, setMyColor] = useState<'w' | 'b' | null>(null);
  const [timeControl, setTimeControl] = useState<TimeControl | null>(
    role === 'host' ? (hostInit?.timeControl ?? null) : null,
  );

  const roomRef = useRef<FakeRoom | null>(null);
  const closedExplicitlyRef = useRef(false);
  const senderMoveRef = useRef<((m: WireMove) => void) | null>(null);
  const senderResignRef = useRef<((m: WireResign) => void) | null>(null);
  const senderResyncRef = useRef<((m: WireResync) => void) | null>(null);

  const moveCbs   = useRef<((m: WireMove) => void)[]>([]);
  const resignCbs = useRef<(() => void)[]>([]);
  const resyncCbs = useRef<((m: WireResync) => void)[]>([]);
  const joinCbs   = useRef<(() => void)[]>([]);
  const leaveCbs  = useRef<(() => void)[]>([]);

  useEffect(() => {
    const room = roomFactory(ROOM_PREFIX + code);
    roomRef.current = room;

    const [sendMove, recvMove]     = room.makeAction<WireMove>('move');
    const [sendResign, recvResign] = room.makeAction<WireResign>('resign');
    const [sendResync, recvResync] = room.makeAction<WireResync>('resync');
    const [sendHello, recvHello]   = room.makeAction<Hello>('hello');

    senderMoveRef.current = sendMove;
    senderResignRef.current = sendResign;
    senderResyncRef.current = sendResync;

    recvMove((msg) => moveCbs.current.forEach((cb) => cb(msg)));
    recvResign(() => resignCbs.current.forEach((cb) => cb()));
    recvResync((msg) => resyncCbs.current.forEach((cb) => cb(msg)));
    recvHello((msg) => {
      // Joiner side
      setMyColor(msg.color);
      setTimeControl(msg.timeControl);
      setStatus('connected');
    });

    room.onPeerJoin(() => {
      joinCbs.current.forEach((cb) => cb());
      if (role === 'host') {
        const hostColor = pickHostColor(hostInit?.color ?? 'random');
        const joinerColor: 'w' | 'b' = hostColor === 'w' ? 'b' : 'w';
        setMyColor(hostColor);
        // Defer hello so the joiner has time to register its recvHello handler
        // (the FakeTrysteroBus fires onPeerJoin synchronously inside the joiner's
        // roomFactory call, before the joiner's effect calls makeAction('hello')).
        queueMicrotask(() => {
          sendHello({ type: 'hello', color: joinerColor, timeControl: hostInit?.timeControl ?? null });
          setStatus('connected');
        });
      }
    });

    room.onPeerLeave(() => {
      leaveCbs.current.forEach((cb) => cb());
      setStatus('disconnected');
    });

    return () => {
      if (!closedExplicitlyRef.current) {
        try { room.leave(); } catch { /* ignore */ }
      }
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribeMove = useCallback((cb: (m: WireMove) => void) => {
    moveCbs.current.push(cb);
    return () => { moveCbs.current = moveCbs.current.filter((x) => x !== cb); };
  }, []);
  const subscribeResign = useCallback((cb: () => void) => {
    resignCbs.current.push(cb);
    return () => { resignCbs.current = resignCbs.current.filter((x) => x !== cb); };
  }, []);
  const subscribeResync = useCallback((cb: (m: WireResync) => void) => {
    resyncCbs.current.push(cb);
    return () => { resyncCbs.current = resyncCbs.current.filter((x) => x !== cb); };
  }, []);
  const subscribeJoin = useCallback((cb: () => void) => {
    joinCbs.current.push(cb);
    return () => { joinCbs.current = joinCbs.current.filter((x) => x !== cb); };
  }, []);
  const subscribeLeave = useCallback((cb: () => void) => {
    leaveCbs.current.push(cb);
    return () => { leaveCbs.current = leaveCbs.current.filter((x) => x !== cb); };
  }, []);

  return useMemo<UseOnlineGameApi>(() => ({
    status, myColor, timeControl,
    sendMove: (m) => senderMoveRef.current?.({ type: 'move', ...m }),
    sendResign: () => senderResignRef.current?.({ type: 'resign' }),
    sendResync: (fen, pgn) => senderResyncRef.current?.({ type: 'resync', fen, pgn }),
    onMove: subscribeMove,
    onResign: subscribeResign,
    onResync: subscribeResync,
    onPeerLeave: subscribeLeave,
    onPeerJoin: subscribeJoin,
    close: () => {
      closedExplicitlyRef.current = true;
      try { roomRef.current?.leave(); } catch { /* ignore */ }
      roomRef.current = null;
      setStatus('closed');
    },
  }), [status, myColor, timeControl, subscribeMove, subscribeResign, subscribeResync, subscribeJoin, subscribeLeave]);
}
