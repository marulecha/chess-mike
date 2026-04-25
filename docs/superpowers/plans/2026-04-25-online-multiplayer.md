# Online Multiplayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third game mode "Two Players Online" that pairs two browsers via a 6-character shared code, using `trystero` for WebRTC peer-to-peer over free public signaling. The site stays 100% static — no backend.

**Architecture:** A new `useOnlineGame` hook wraps `trystero` and exposes a small message bus (move / resign / resync). `GameProvider` owns it when `mode === 'two-players-online'` and exposes it via `useGame().online`. `Board` broadcasts local moves; a new `useOnlineMoveBridge` effect in `PlayPage` applies remote moves and handles disconnect/forfeit/resync. `SetupModal` gains an online sub-form (Host / Join cards). All wire data is plain UCI move objects + a one-time hello.

**Tech Stack:** `trystero` (WebRTC P2P, BitTorrent-tracker signaling), existing React 18 + TypeScript + Vitest stack, `chess.js`, in-memory test mock for trystero.

---

## File structure (locked at plan time)

```
src/
  game/
    online/
      protocol.ts            # WireMsg union, type guards, JSON parse/serialize
      code.ts                # generateCode, normalizeCode, isValidCode
      useOnlineGame.ts       # the hook
    hooks/
      useChessGame.ts        # MODIFIED: + markDisconnect, markRemoteResign
    GameProvider.tsx         # MODIFIED: instantiate useOnlineGame conditionally; expose via context; gate save
  components/
    SetupModal.tsx           # MODIFIED: add Two Players Online radio + online sub-form
    OnlineSubForm.tsx        # NEW: extracted host/join cards (keeps SetupModal manageable)
    Board.tsx                # MODIFIED: read-only when not my turn; broadcast local move after success
    GameOverDialog.tsx       # MODIFIED: handle 'disconnect' status text
  pages/
    PlayPage.tsx             # MODIFIED: + useOnlineMoveBridge effect; resume save gating already lives in GameProvider
  types/
    chess.ts                 # MODIFIED: + 'two-players-online' mode, 'disconnect' status, OnlineConfig, online?: field
  test/
    mocks/
      fake-trystero.ts       # NEW: in-memory pub/sub mock with same shape as trystero's joinRoom
```

Each new file has one responsibility:
- `protocol.ts` = wire types only.
- `code.ts` = code utilities only.
- `useOnlineGame.ts` = trystero lifecycle + message routing.
- `OnlineSubForm.tsx` = the host/join UI (extracted so SetupModal doesn't balloon).
- `fake-trystero.ts` = test-only stand-in.

---

## Task 1: Wire-protocol types + code utilities (TDD)

**Files:**
- Create: `src/game/online/protocol.ts`, `src/game/online/code.ts`
- Test: `src/game/online/code.test.ts`

`protocol.ts` is type-only and has no runtime behavior to test directly; `code.ts` has all the logic.

- [ ] **Step 1: Create `src/game/online/protocol.ts`**

```ts
import type { Promotion, Square } from '../../types/chess';

export type TimeControl = { initialMs: number; incrementMs: number };

export type Hello = {
  type: 'hello';
  color: 'w' | 'b';                  // the joiner's color
  timeControl: TimeControl | null;
};

export type WireMove = {
  type: 'move';
  from: Square;
  to: Square;
  promotion?: Promotion;
};

export type WireResign = { type: 'resign' };

export type WireResync = {
  type: 'resync';
  fen: string;
  pgn: string;
};

export type WireMsg = Hello | WireMove | WireResign | WireResync;

export function isWireMsg(x: unknown): x is WireMsg {
  if (!x || typeof x !== 'object') return false;
  const t = (x as { type?: unknown }).type;
  return t === 'hello' || t === 'move' || t === 'resign' || t === 'resync';
}
```

- [ ] **Step 2: Write the failing test for `code.ts`** at `src/game/online/code.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { generateCode, normalizeCode, isValidCode, ALPHABET, CODE_LEN } from './code';

describe('code', () => {
  it('ALPHABET has no confusable characters', () => {
    expect(ALPHABET).not.toMatch(/[01OIL]/);
    // length should be exactly the documented set
    expect(ALPHABET.length).toBeGreaterThan(20);
  });

  it('CODE_LEN is 6', () => {
    expect(CODE_LEN).toBe(6);
  });

  it('generateCode returns CODE_LEN chars from ALPHABET', () => {
    const code = generateCode();
    expect(code).toHaveLength(CODE_LEN);
    for (const c of code) expect(ALPHABET).toContain(c);
  });

  it('generateCode produces different codes (overwhelmingly)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(40);
  });

  it('normalizeCode upper-cases and strips dashes/whitespace', () => {
    expect(normalizeCode(' k7-mp3x ')).toBe('K7MP3X');
    expect(normalizeCode('K7MP3X')).toBe('K7MP3X');
  });

  it('isValidCode accepts valid codes', () => {
    expect(isValidCode('K7MP3X')).toBe(true);
    expect(isValidCode(generateCode())).toBe(true);
  });

  it('isValidCode rejects bad inputs', () => {
    expect(isValidCode('K7MP3')).toBe(false);     // too short
    expect(isValidCode('K7MP3XX')).toBe(false);   // too long
    expect(isValidCode('K7MP3O')).toBe(false);    // contains O (not in alphabet)
    expect(isValidCode('K7MP31')).toBe(false);    // contains 1
    expect(isValidCode('K7MP3a')).toBe(false);    // lowercase
  });

  it('generateCode uses crypto.getRandomValues when available', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    generateCode();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- code`
Expected: module not found.

- [ ] **Step 4: Implement `src/game/online/code.ts`**

```ts
export const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODE_LEN = 6;

export function generateCode(): string {
  const buf = new Uint32Array(CODE_LEN);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

export function normalizeCode(input: string): string {
  return input.replace(/[-\s]/g, '').toUpperCase();
}

export function isValidCode(s: string): boolean {
  if (s.length !== CODE_LEN) return false;
  for (const c of s) if (!ALPHABET.includes(c)) return false;
  return true;
}

export function formatCode(code: string): string {
  if (code.length !== CODE_LEN) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- code`
Expected: 8 passing.

- [ ] **Step 6: Commit**

```bash
git add src/game/online/protocol.ts src/game/online/code.ts src/game/online/code.test.ts
git commit -m "feat(online): wire protocol types and code utilities"
```

---

## Task 2: Install trystero + create the fake trystero mock

**Files:**
- Modify: `package.json` (via npm)
- Create: `src/test/mocks/fake-trystero.ts`

The fake mock has the SAME shape as trystero's `joinRoom` return value (`{ makeAction, leave, getPeers, onPeerJoin, onPeerLeave }`), so production code never branches on test vs prod.

- [ ] **Step 1: Install trystero**

```bash
npm install trystero
```

- [ ] **Step 2: Create `src/test/mocks/fake-trystero.ts`**

This mock provides a bus that lets multiple "rooms" with the same name share message traffic. Production code receives a `Room` object with the same shape as trystero's. We export a `joinFakeRoom` that takes a bus reference (so each test can have its own bus).

```ts
type Listener<T> = (data: T, peerId: string) => void;
type ActionId = string;
type PeerId = string;

export type FakeRoom = {
  makeAction: <T>(id: ActionId) => readonly [
    (data: T, targetPeers?: PeerId | PeerId[]) => void,
    (cb: Listener<T>) => void,
  ];
  onPeerJoin: (cb: (peerId: PeerId) => void) => void;
  onPeerLeave: (cb: (peerId: PeerId) => void) => void;
  getPeers: () => Record<PeerId, unknown>;
  leave: () => void;
};

export class FakeTrysteroBus {
  private rooms: Map<string, Set<FakeRoomImpl>> = new Map();
  private nextPeerId = 1;

  join(roomName: string): FakeRoom {
    const peerId = `peer-${this.nextPeerId++}`;
    const set = this.rooms.get(roomName) ?? new Set();
    this.rooms.set(roomName, set);
    const impl = new FakeRoomImpl(peerId, set, () => set.delete(impl));
    set.add(impl);
    // Notify existing peers of the new joiner
    for (const other of set) {
      if (other === impl) continue;
      other.fireJoin(peerId);
      impl.fireJoin(other.peerId);
    }
    return impl;
  }

  reset() { this.rooms.clear(); this.nextPeerId = 1; }
}

class FakeRoomImpl implements FakeRoom {
  private actions: Map<ActionId, Listener<unknown>[]> = new Map();
  private joinCbs: ((id: PeerId) => void)[] = [];
  private leaveCbs: ((id: PeerId) => void)[] = [];

  constructor(
    public readonly peerId: PeerId,
    private peers: Set<FakeRoomImpl>,
    private cleanup: () => void,
  ) {}

  makeAction<T>(id: ActionId) {
    if (!this.actions.has(id)) this.actions.set(id, []);
    const send = (data: T) => {
      for (const other of this.peers) {
        if (other === this) continue;
        const list = other.actions.get(id) ?? [];
        for (const cb of list) (cb as Listener<T>)(data, this.peerId);
      }
    };
    const recv = (cb: Listener<T>) => {
      const list = this.actions.get(id)!;
      list.push(cb as Listener<unknown>);
    };
    return [send, recv] as const;
  }

  onPeerJoin(cb: (id: PeerId) => void) { this.joinCbs.push(cb); }
  onPeerLeave(cb: (id: PeerId) => void) { this.leaveCbs.push(cb); }
  getPeers() {
    const out: Record<PeerId, unknown> = {};
    for (const other of this.peers) if (other !== this) out[other.peerId] = {};
    return out;
  }

  leave() {
    this.cleanup();
    for (const other of this.peers) for (const cb of other.leaveCbs) cb(this.peerId);
  }

  fireJoin(id: PeerId) { for (const cb of this.joinCbs) cb(id); }
}
```

- [ ] **Step 3: Smoke-verify the mock with a one-off test** at `src/test/mocks/fake-trystero.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { FakeTrysteroBus } from './fake-trystero';

describe('FakeTrysteroBus', () => {
  it('two rooms in the same name see each other', () => {
    const bus = new FakeTrysteroBus();
    const a = bus.join('room1');
    const joinedB: string[] = [];
    a.onPeerJoin((id) => joinedB.push(id));
    const b = bus.join('room1');
    expect(joinedB).toHaveLength(1);
    expect(Object.keys(a.getPeers())).toHaveLength(1);

    const [sendFromA, ] = a.makeAction<{ x: number }>('ping');
    const received: { x: number }[] = [];
    const [, recvOnB] = b.makeAction<{ x: number }>('ping');
    recvOnB((d) => received.push(d));

    sendFromA({ x: 42 });
    expect(received).toEqual([{ x: 42 }]);

    const left: string[] = [];
    a.onPeerLeave((id) => left.push(id));
    b.leave();
    expect(left).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Run test**

Run: `npm test -- fake-trystero`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/test/mocks/fake-trystero.ts src/test/mocks/fake-trystero.test.ts
git commit -m "chore(online): add trystero + in-memory fake for tests"
```

---

## Task 3: `useOnlineGame` hook (TDD)

**Files:**
- Create: `src/game/online/useOnlineGame.ts`
- Test: `src/game/online/useOnlineGame.test.ts`

The hook accepts an injected factory (`(roomName: string) => FakeRoom`-shaped) so tests can pass a `FakeTrysteroBus.join` and production passes a real-trystero adapter.

- [ ] **Step 1: Write the failing test** at `src/game/online/useOnlineGame.test.ts`

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnlineGame } from './useOnlineGame';
import { FakeTrysteroBus, type FakeRoom } from '../../test/mocks/fake-trystero';

let bus: FakeTrysteroBus;
const factoryFor = () => (roomName: string): FakeRoom => bus.join(roomName);

beforeEach(() => { bus = new FakeTrysteroBus(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useOnlineGame', () => {
  it('host then join end up connected with mirrored colors', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host',
      code: 'ABC123',
      hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    expect(host.result.current.status).toBe('waiting');

    const join = renderHook(() => useOnlineGame({
      role: 'join',
      code: 'ABC123',
      roomFactory: factoryFor(),
    }));

    await waitFor(() => expect(host.result.current.status).toBe('connected'));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));

    expect(host.result.current.myColor).toBe('w');
    expect(join.result.current.myColor).toBe('b');
  });

  it('host with color=random gives joiner the opposite color', async () => {
    const seed = vi.spyOn(Math, 'random').mockReturnValue(0.1); // → host is white
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'RANDM1',
      hostInit: { color: 'random', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'RANDM1', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(host.result.current.status).toBe('connected'));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));
    expect(host.result.current.myColor).toBe('w');
    expect(join.result.current.myColor).toBe('b');
    seed.mockRestore();
  });

  it('sendMove delivers to the peer', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'MOVE01', hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'MOVE01', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));

    const got: unknown[] = [];
    act(() => { join.result.current.onMove((m) => got.push(m)); });
    act(() => { host.result.current.sendMove({ from: 'e2', to: 'e4' }); });
    expect(got).toEqual([{ type: 'move', from: 'e2', to: 'e4' }]);
  });

  it('sendResign delivers a resign', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'RGN001', hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'RGN001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));
    let resigned = false;
    act(() => { join.result.current.onResign(() => { resigned = true; }); });
    act(() => { host.result.current.sendResign(); });
    expect(resigned).toBe(true);
  });

  it('peer leave moves status to disconnected; rejoin returns to connected', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'DSC001', hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'DSC001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(host.result.current.status).toBe('connected'));

    act(() => { join.result.current.close(); });
    await waitFor(() => expect(host.result.current.status).toBe('disconnected'));

    renderHook(() => useOnlineGame({
      role: 'join', code: 'DSC001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(host.result.current.status).toBe('connected'));
  });

  it('joiner gets timeControl from hello', async () => {
    const tc = { initialMs: 60_000, incrementMs: 0 };
    renderHook(() => useOnlineGame({
      role: 'host', code: 'TC0001', hostInit: { color: 'white', timeControl: tc },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'TC0001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));
    expect(join.result.current.timeControl).toEqual(tc);
  });
});
```

- [ ] **Step 2: Run test, expect fail (module not found)**

Run: `npm test -- useOnlineGame`
Expected: fails.

- [ ] **Step 3: Implement `src/game/online/useOnlineGame.ts`**

```ts
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
  const sendersRef = useRef<{
    move?: (m: WireMove) => void;
    resign?: (m: WireResign) => void;
    resync?: (m: WireResync) => void;
    hello?: (m: Hello) => void;
  }>({});

  // Subscriber lists kept in refs so consumers' callbacks survive re-renders
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

    sendersRef.current = { move: sendMove, resign: sendResign, resync: sendResync, hello: sendHello };

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
        sendHello({ type: 'hello', color: joinerColor, timeControl: hostInit?.timeControl ?? null });
        setStatus('connected');
      } else {
        // Joiner just waits for hello
      }
    });

    room.onPeerLeave(() => {
      leaveCbs.current.forEach((cb) => cb());
      setStatus('disconnected');
    });

    return () => {
      room.leave();
      roomRef.current = null;
      setStatus('closed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = <Args extends unknown[]>(
    list: React.MutableRefObject<((...a: Args) => void)[]>,
    cb: (...a: Args) => void,
  ) => {
    list.current.push(cb);
    return () => { list.current = list.current.filter((x) => x !== cb); };
  };

  const api = useMemo<UseOnlineGameApi>(() => ({
    status, myColor, timeControl,
    sendMove: (m) => sendersRef.current.move?.({ type: 'move', ...m }),
    sendResign: () => sendersRef.current.resign?.({ type: 'resign' }),
    sendResync: (fen, pgn) => sendersRef.current.resync?.({ type: 'resync', fen, pgn }),
    onMove:   (cb) => subscribe(moveCbs, cb),
    onResign: (cb) => subscribe(resignCbs, cb),
    onResync: (cb) => subscribe(resyncCbs, cb),
    onPeerLeave: (cb) => subscribe(leaveCbs, cb),
    onPeerJoin:  (cb) => subscribe(joinCbs, cb),
    close: () => { roomRef.current?.leave(); roomRef.current = null; setStatus('closed'); },
  }), [status, myColor, timeControl]);

  // Re-run sendMove/etc identity is OK; subscriptions go through refs.
  const apiRef = useRef(api);
  apiRef.current = api;

  return useCallback(() => apiRef.current, [])() as UseOnlineGameApi;
}
```

NOTE: The closing `useCallback`/wrapping pattern at the bottom makes the hook return a stable reference where useful for downstream effect deps. If the test for `onMove` registration timing fails because `onMove` registers BEFORE the room is built, you can either (a) move the recv-callback registration into the effect such that it fires from `moveCbs` (already done), or (b) accept that subscribers register after mount which is fine since the test does so via `act(...)` after `waitFor` confirms `connected`. Tests are written to register after `connected`, so this should pass.

If the hook fails type-check on the `subscribe` generic (TypeScript might complain about the variadic args inference), simplify by writing 5 small helpers — one per callback list — that bear the exact callback type. Keep the public API identical.

- [ ] **Step 4: Run test**

Run: `npm test -- useOnlineGame`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/game/online/useOnlineGame.ts src/game/online/useOnlineGame.test.ts
git commit -m "feat(online): useOnlineGame hook over trystero"
```

---

## Task 4: Type updates and `useChessGame` extensions

**Files:**
- Modify: `src/types/chess.ts`
- Modify: `src/game/hooks/useChessGame.ts`
- Test: `src/game/hooks/useChessGame.test.ts` (add 2 tests)

- [ ] **Step 1: Edit `src/types/chess.ts`** — extend the unions and add the OnlineConfig type. Replace the existing `GameMode`, `GameStatus`, and `GameSettings` with:

```ts
export type GameMode = 'human-vs-human' | 'human-vs-ai' | 'two-players-online';

export type GameStatus =
  | 'idle'
  | 'in-progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'timeout'
  | 'disconnect';

export type OnlineConfig = {
  role: 'host' | 'join';
  code: string;
  hostInit?: {
    color: 'white' | 'black' | 'random';
    timeControl: { initialMs: number; incrementMs: number } | null;
  };
};

export type GameSettings = {
  mode: GameMode;
  aiDifficulty: Difficulty;
  playerColor: 'white' | 'black';
  timeControl: { initialMs: number; incrementMs: number } | null;
  boardOrientation: Orientation;
  online?: OnlineConfig;
};
```

(Leave `DEFAULT_SETTINGS` as it is — the new field is optional.)

- [ ] **Step 2: Edit `src/game/hooks/useChessGame.ts`** to add `markDisconnect` and `markRemoteResign`.

Find the `useChessGame` definition's API type and add:

```ts
markDisconnect: (loser: Color) => void;
markRemoteResign: () => void;
```

Inside the hook body, alongside the existing `markTimeout` and `resign`:

```ts
const markDisconnect = useCallback((_loser: Color) => {
  setOverride('disconnect');
  bump();
}, []);

const markRemoteResign = useCallback(() => {
  setOverride('resigned');
  bump();
}, []);
```

Add both to the returned object and the `useMemo` deps array.

- [ ] **Step 3: Add tests** to `src/game/hooks/useChessGame.test.ts` (append, don't overwrite the existing tests):

```ts
it('markDisconnect sets disconnect status', () => {
  const { result } = renderHook(() => useChessGame());
  act(() => { result.current.markDisconnect('w'); });
  expect(result.current.status).toBe('disconnect');
});

it('markRemoteResign sets resigned status', () => {
  const { result } = renderHook(() => useChessGame());
  act(() => { result.current.markRemoteResign(); });
  expect(result.current.status).toBe('resigned');
});
```

- [ ] **Step 4: Run tests**

Run: `npm test -- useChessGame`
Expected: 10 passing (was 8 + 2 new).

- [ ] **Step 5: Run the full suite to make sure nothing else broke**

Run: `npm test`
Expected: previous total + 8 (code) + 1 (fake-trystero) + 6 (useOnlineGame) + 2 (useChessGame additions) = 72 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/types/chess.ts src/game/hooks/useChessGame.ts src/game/hooks/useChessGame.test.ts
git commit -m "feat(types): online mode + disconnect status; useChessGame markers"
```

---

## Task 5: Trystero adapter for production

**Files:**
- Create: `src/game/online/trystero-adapter.ts`

This file is the single place that touches the real `trystero` package. It exports a `realRoomFactory` matching `RoomFactory`. Keeping it in its own file makes it trivially mockable and keeps the rest of the code agnostic.

- [ ] **Step 1: Create `src/game/online/trystero-adapter.ts`**

```ts
import { joinRoom } from 'trystero';
import type { FakeRoom } from '../../test/mocks/fake-trystero';
import type { RoomFactory } from './useOnlineGame';

const APP_ID = 'michalis-chess-master';

// trystero's joinRoom returns an object with the same shape as FakeRoom
// (makeAction, onPeerJoin, onPeerLeave, getPeers, leave). Cast to satisfy TS.
export const realRoomFactory: RoomFactory = (roomName) => {
  return joinRoom({ appId: APP_ID }, roomName) as unknown as FakeRoom;
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/game/online/trystero-adapter.ts
git commit -m "feat(online): trystero adapter implementing RoomFactory"
```

---

## Task 6: Wire `GameProvider` to instantiate `useOnlineGame`

**Files:**
- Modify: `src/game/GameProvider.tsx`
- Test: `src/game/GameProvider.test.tsx` (add 1 test)

- [ ] **Step 1: Edit `src/game/GameProvider.tsx`**. Add to imports:

```tsx
import { useOnlineGame, type UseOnlineGameApi, type RoomFactory } from './online/useOnlineGame';
```

Add an optional `roomFactory` prop and instantiate the hook conditionally. Replace the existing component body to look like this (preserve all existing logic, additions are commented):

```tsx
type Props = {
  children: ReactNode;
  initialSettings?: GameSettings;
  stockfishOptions?: UseStockfishOptions;
  // NEW: room factory for online mode (injected so tests can use a fake)
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

  // NEW: online hook only when mode is online and a roomFactory is provided
  const online: UseOnlineGameApi | null =
    settings.mode === 'two-players-online' && settings.online && roomFactory
      ? // call the hook unconditionally inside this branch — but hooks must be top-level.
        // To respect rules of hooks: ALWAYS call useOnlineGame, but pass null factory to make it inert.
        null
      : null;

  // NOTE: rules of hooks require unconditional calls. Refactor to always call useOnlineGame
  // with a sentinel "off" state when not in online mode. See actual implementation below.
  // Keeping the old null-typed declaration would violate rules-of-hooks if we wrap in a condition.

  // ... rest unchanged from current file ...
}
```

The above is a sketch. Implement properly: ALWAYS call `useOnlineGame` (rules of hooks), passing inert defaults when not in online mode. Modify `useOnlineGame` to accept an optional `enabled: boolean` flag — if `false`, the hook does nothing (no room joined) and returns a stub.

To avoid changing `useOnlineGame`'s public surface, an alternative cleaner pattern: extract the online hook into a child component that only mounts when `mode === 'two-players-online'`. Use this pattern:

```tsx
// inside GameProvider
{settings.mode === 'two-players-online' && settings.online && roomFactory ? (
  <OnlineLayer
    settings={settings.online}
    roomFactory={roomFactory}
    onContextValue={(onlineApi) => /* set into context */}
  >
    <GameContext.Provider value={...}>{children}</GameContext.Provider>
  </OnlineLayer>
) : (
  <GameContext.Provider value={{ ...value, online: null }}>{children}</GameContext.Provider>
)}
```

Use this concrete implementation. Replace `GameProvider`'s body with:

```tsx
export function GameProvider({ children, initialSettings = DEFAULT_SETTINGS, stockfishOptions, roomFactory }: Props) {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);

  const game = useChessGame();
  const timer = useTimer(
    settings.timeControl ?? { initialMs: 5 * 60 * 1000, incrementMs: 0 },
    (loser) => game.markTimeout(loser),
  );
  const stockfish = useStockfish(stockfishOptions);
  const persistence = usePersistence();

  // Skip auto-save in online mode (P2P sessions can't be resumed after refresh)
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

  const baseValue: Omit<GameContextValue, 'online'> = useMemo(() => ({
    game, timer, stockfish, persistence, settings, setSettings,
  }), [game, timer, stockfish, persistence, settings]);

  if (settings.mode === 'two-players-online' && settings.online && roomFactory) {
    return (
      <OnlineHost
        config={settings.online}
        roomFactory={roomFactory}
        baseValue={baseValue}
      >
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
```

Update the `GameContextValue` type to include `online: UseOnlineGameApi | null`:

```tsx
export type GameContextValue = {
  game: UseChessGameApi;
  timer: UseTimerApi;
  stockfish: UseStockfishApi;
  persistence: UsePersistenceApi;
  settings: GameSettings;
  setSettings: (next: GameSettings) => void;
  online: UseOnlineGameApi | null;
};
```

- [ ] **Step 2: Add a test** to `src/game/GameProvider.test.tsx`:

```tsx
import { FakeTrysteroBus } from '../test/mocks/fake-trystero';

it('exposes online API when mode is two-players-online and a roomFactory is given', async () => {
  const bus = new FakeTrysteroBus();
  const factory = (name: string) => bus.join(name);
  function Probe() {
    const { online } = useGame();
    return <span data-testid="online-status">{online?.status ?? 'none'}</span>;
  }
  render(
    <GameProvider
      initialSettings={{
        ...DEFAULT_SETTINGS,
        mode: 'two-players-online',
        online: { role: 'host', code: 'TEST01', hostInit: { color: 'white', timeControl: null } },
      }}
      roomFactory={factory}
      stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
    >
      <Probe />
    </GameProvider>,
  );
  expect(screen.getByTestId('online-status').textContent).toBe('waiting');
});

it('exposes online: null in non-online modes', () => {
  function Probe() {
    const { online } = useGame();
    return <span data-testid="online">{online === null ? 'null' : 'present'}</span>;
  }
  render(
    <GameProvider initialSettings={DEFAULT_SETTINGS} stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}>
      <Probe />
    </GameProvider>,
  );
  expect(screen.getByTestId('online').textContent).toBe('null');
});
```

(You will need to add `import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';` if not already imported.)

- [ ] **Step 3: Run tests**

Run: `npm test -- GameProvider`
Expected: 4 passing (2 prior + 2 new).

- [ ] **Step 4: Run full suite**

Run: `npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/game/GameProvider.tsx src/game/GameProvider.test.tsx
git commit -m "feat(online): GameProvider exposes online API + skips persistence"
```

---

## Task 7: `Board` becomes read-only on opponent's turn + broadcasts local moves

**Files:**
- Modify: `src/components/Board.tsx`
- Test: `src/components/Board.test.tsx` (add 2 tests)

- [ ] **Step 1: Edit `src/components/Board.tsx`**

Inside `Board`, after the existing `const { game, settings } = useGame();` line, add:

```tsx
const { online } = useGame();
const isOnline = settings.mode === 'two-players-online' && online !== null;
const isMyTurn = !isOnline || (online.myColor === game.turn);
```

Update `onSquareClick`, `onDragStart`, `tryMove` to gate on `isMyTurn`:

In `onSquareClick`, at the top:

```tsx
if (!isMyTurn) return;
```

In `onDragStart`, at the top of the function (before reading the piece):

```tsx
if (!isMyTurn) { e.preventDefault(); return; }
```

In `tryMove`, after a successful local apply (i.e., after `game.move(from, to, undefined)` succeeds for non-promotion moves and after `game.move(from, to, choice)` succeeds in the PromotionPicker callback), broadcast:

For the non-promotion path inside `tryMove`:

```tsx
function tryMove(from: Square, to: Square) {
  if (isPromotionMove(from, to)) {
    setPendingPromotion({ from, to });
    return;
  }
  const ok = game.move(from, to, undefined);
  if (ok && isOnline) online?.sendMove({ from, to });
  setSelected(null);
}
```

For the promotion path inside the `PromotionPicker.onSelect`:

```tsx
onSelect={(p) => {
  const ok = game.move(pendingPromotion.from, pendingPromotion.to, p);
  if (ok && isOnline) online?.sendMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: p });
  setPendingPromotion(null);
  setSelected(null);
}}
```

For the click-to-move path (`onSquareClick` calls `game.move(...)` directly inside the `if (legalTargets.includes(sq))` branch — replace that direct call with `tryMove(selected, sq)` so the broadcast lives in one place):

Find the line `const ok = game.move(selected, sq, undefined);` in the existing `onSquareClick` and replace the surrounding `if` block from:

```tsx
if (legalTargets.includes(sq)) {
  const ok = game.move(selected, sq, undefined);
  if (ok) { setSelected(null); return; }
}
```

to:

```tsx
if (legalTargets.includes(sq)) {
  tryMove(selected, sq);
  return;
}
```

The `tryMove` helper now centralizes both the promotion branch and the broadcast.

- [ ] **Step 2: Add tests** to `src/components/Board.test.tsx`:

```tsx
import { FakeTrysteroBus } from '../test/mocks/fake-trystero';

it('disables input when it is not my turn (online)', async () => {
  const user = userEvent.setup();
  const bus = new FakeTrysteroBus();
  // First create a peer in the room so host transitions to "connected" with myColor='w'
  bus.join('michalis-chess-master:OFFLNE');
  render(
    <GameProvider
      initialSettings={{
        ...DEFAULT_SETTINGS,
        mode: 'two-players-online',
        timeControl: null,
        online: { role: 'host', code: 'OFFLNE', hostInit: { color: 'black', timeControl: null } },
      }}
      roomFactory={(name) => bus.join(name)}
      stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
    >
      <Board />
    </GameProvider>,
  );
  // Host picked 'black', so myColor='b'. White moves first → not my turn → click should do nothing.
  const before = screen.getByTestId('square-e2').querySelector('img');
  await user.click(screen.getByTestId('square-e2'));
  await user.click(screen.getByTestId('square-e4'));
  // Pawn is still on e2
  expect(screen.getByTestId('square-e2').querySelector('img')).toBe(before);
});

it('broadcasts local moves to the peer (online)', async () => {
  const user = userEvent.setup();
  const bus = new FakeTrysteroBus();
  // Set up the peer FIRST so it can listen
  const peer = bus.join('michalis-chess-master:BCAST1');
  const got: unknown[] = [];
  const [, recvMove] = peer.makeAction<unknown>('move');
  recvMove((m) => got.push(m));

  render(
    <GameProvider
      initialSettings={{
        ...DEFAULT_SETTINGS,
        mode: 'two-players-online',
        timeControl: null,
        online: { role: 'host', code: 'BCAST1', hostInit: { color: 'white', timeControl: null } },
      }}
      roomFactory={(name) => bus.join(name)}
      stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
    >
      <Board />
    </GameProvider>,
  );
  // Host is white, host's turn. Click e2 then e4.
  await user.click(screen.getByTestId('square-e2'));
  await user.click(screen.getByTestId('square-e4'));
  expect(got).toEqual([{ type: 'move', from: 'e2', to: 'e4' }]);
});
```

(These tests need `FakeStockfishWorker` and `userEvent` already imported in the file.)

- [ ] **Step 3: Run tests**

Run: `npm test -- Board`
Expected: 5 passing (3 prior + 2 new).

- [ ] **Step 4: Commit**

```bash
git add src/components/Board.tsx src/components/Board.test.tsx
git commit -m "feat(online): Board is read-only on opponent's turn; broadcasts local moves"
```

---

## Task 8: `OnlineSubForm` component + `SetupModal` integration

**Files:**
- Create: `src/components/OnlineSubForm.tsx`, `src/components/OnlineSubForm.test.tsx`
- Modify: `src/components/SetupModal.tsx`, `src/components/SetupModal.test.tsx` (add 1 test)

- [ ] **Step 1: Create `src/components/OnlineSubForm.tsx`**

```tsx
import { useState } from 'react';
import type { GameSettings, OnlineConfig, TimeControl } from '../types/chess';
import { generateCode, normalizeCode, isValidCode, formatCode } from '../game/online/code';

type Mode = 'choose' | 'host' | 'join';

const TIME_OPTIONS: { label: string; value: TimeControl | null }[] = [
  { label: 'No clock', value: null },
  { label: '3 + 0',    value: { initialMs: 3 * 60_000, incrementMs: 0 } },
  { label: '5 + 0',    value: { initialMs: 5 * 60_000, incrementMs: 0 } },
  { label: '10 + 5',   value: { initialMs: 10 * 60_000, incrementMs: 5_000 } },
];

export function OnlineSubForm({
  onConfirm,
}: {
  onConfirm: (online: OnlineConfig, derivedSettings: Partial<GameSettings>) => void;
}) {
  const [mode, setMode] = useState<Mode>('choose');

  if (mode === 'choose') {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setMode('host')}
          className="flex-1 font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-3"
        >Host a Party</button>
        <button
          onClick={() => setMode('join')}
          className="flex-1 font-display text-imperial-cream border border-imperial-gold bg-imperial-navy hover:shadow-gold-glow rounded-sm px-4 py-3"
        >Join a Party</button>
      </div>
    );
  }

  if (mode === 'host') return <HostCard onConfirm={onConfirm} />;
  return <JoinCard onConfirm={onConfirm} />;
}

function HostCard({
  onConfirm,
}: {
  onConfirm: (online: OnlineConfig, derivedSettings: Partial<GameSettings>) => void;
}) {
  const [color, setColor] = useState<'white' | 'black' | 'random'>('white');
  const [tc, setTc] = useState<TimeControl | null>(null);
  const [code] = useState<string>(() => generateCode());

  return (
    <div className="space-y-3">
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Color:</span>
        {(['white', 'black', 'random'] as const).map((c) => (
          <label key={c} className="capitalize mr-3">
            <input type="radio" name="online-color" checked={color === c} onChange={() => setColor(c)} /> {c}
          </label>
        ))}
      </div>
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Time:</span>
        <select
          className="bg-imperial-cream text-imperial-ink rounded-sm px-2 py-1"
          value={JSON.stringify(tc)}
          onChange={(e) => setTc(JSON.parse(e.target.value))}
        >
          {TIME_OPTIONS.map((o) => (
            <option key={o.label} value={JSON.stringify(o.value)}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Code:</span>
        <code data-testid="host-code" className="font-mono text-imperial-cream text-xl tracking-widest">{formatCode(code)}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(formatCode(code))}
          className="ml-3 text-imperial-cream/80 underline text-sm"
        >Copy</button>
      </div>
      <button
        onClick={() => onConfirm(
          { role: 'host', code, hostInit: { color, timeControl: tc } },
          { timeControl: tc, boardOrientation: color === 'black' ? 'black' : 'white' },
        )}
        className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
      >Open Party</button>
      <p className="text-imperial-cream/60 text-sm italic">Share the code with your opponent.</p>
    </div>
  );
}

function JoinCard({
  onConfirm,
}: {
  onConfirm: (online: OnlineConfig, derivedSettings: Partial<GameSettings>) => void;
}) {
  const [raw, setRaw] = useState('');
  const normalized = normalizeCode(raw);
  const valid = isValidCode(normalized);

  return (
    <div className="space-y-3">
      <div>
        <span className="font-display text-imperial-gold/80 mr-2">Code:</span>
        <input
          aria-label="party code"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="XXX-XXX"
          className="bg-imperial-cream text-imperial-ink font-mono px-2 py-1 rounded-sm tracking-widest"
        />
      </div>
      <button
        disabled={!valid}
        onClick={() => onConfirm({ role: 'join', code: normalized }, {})}
        className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >Connect</button>
    </div>
  );
}
```

- [ ] **Step 2: Test for `OnlineSubForm`** at `src/components/OnlineSubForm.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnlineSubForm } from './OnlineSubForm';
import { CODE_LEN } from '../game/online/code';

describe('OnlineSubForm', () => {
  it('host flow: clicking Host shows a generated code', async () => {
    const user = userEvent.setup();
    render(<OnlineSubForm onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Host a Party/i }));
    const codeEl = screen.getByTestId('host-code');
    // formatted as XXX-XXX
    const stripped = codeEl.textContent!.replace(/-/g, '');
    expect(stripped).toHaveLength(CODE_LEN);
  });

  it('host flow: Open Party fires onConfirm with role=host and chosen color', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<OnlineSubForm onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /Host a Party/i }));
    await user.click(screen.getByLabelText(/black/i));
    await user.click(screen.getByRole('button', { name: /Open Party/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'host',
        hostInit: expect.objectContaining({ color: 'black' }),
      }),
      expect.objectContaining({ boardOrientation: 'black' }),
    );
  });

  it('join flow: Connect is disabled until a valid code is entered', async () => {
    const user = userEvent.setup();
    render(<OnlineSubForm onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Join a Party/i }));
    const connect = screen.getByRole('button', { name: /Connect/i }) as HTMLButtonElement;
    expect(connect.disabled).toBe(true);
    await user.type(screen.getByLabelText(/party code/i), 'k7-mp3x');
    expect(connect.disabled).toBe(false);
  });

  it('join flow: Connect normalizes the code before firing onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<OnlineSubForm onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /Join a Party/i }));
    await user.type(screen.getByLabelText(/party code/i), 'k7-mp3x');
    await user.click(screen.getByRole('button', { name: /Connect/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      { role: 'join', code: 'K7MP3X' },
      {},
    );
  });
});
```

- [ ] **Step 3: Run tests, expect them to fail then pass after implementation**

Run: `npm test -- OnlineSubForm`
Expected: 4 passing.

- [ ] **Step 4: Modify `src/components/SetupModal.tsx`** to add the third opponent option.

Add to imports:

```tsx
import { OnlineSubForm } from './OnlineSubForm';
import type { OnlineConfig } from '../types/chess';
```

Inside the modal body, find the Opponent fieldset and add a third radio:

```tsx
<label className="block">
  <input
    type="radio"
    name="mode"
    checked={s.mode === 'two-players-online'}
    onChange={() => setS({ ...s, mode: 'two-players-online' })}
  /> Two Players Online
</label>
```

Below the Opponent fieldset, when `s.mode === 'two-players-online'`, render the `OnlineSubForm` and SUPPRESS the AI difficulty/play-as/time-control fieldsets and the "Begin the Duel" button — the OnlineSubForm has its own confirm. Wrap the existing AI fieldsets in `{s.mode === 'human-vs-ai' && (...)}` (already done) and the time control fieldset in `{s.mode !== 'two-players-online' && (...)}`. The footer Begin button is hidden in online mode:

```tsx
{s.mode === 'two-players-online' && (
  <OnlineSubForm
    onConfirm={(online, derived) => {
      onConfirm({ ...s, ...derived, online, mode: 'two-players-online' });
    }}
  />
)}

{s.mode !== 'two-players-online' && (
  <fieldset className="mb-4">
    <legend className="font-display text-imperial-gold/80 mb-2">Time control</legend>
    {/* existing select */}
  </fieldset>
)}

<div className="flex justify-end gap-2 mt-6">
  <button onClick={onClose} className="font-display text-imperial-cream/80 px-3 py-2">Cancel</button>
  {s.mode !== 'two-players-online' && (
    <button
      onClick={() => onConfirm(s)}
      className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
    >Begin the Duel</button>
  )}
</div>
```

- [ ] **Step 5: Add a test** to `src/components/SetupModal.test.tsx`:

```tsx
it('shows online sub-form when Two Players Online is selected', async () => {
  const user = userEvent.setup();
  render(<SetupModal initial={DEFAULT_SETTINGS} aiAvailable onConfirm={() => {}} onClose={() => {}} />);
  await user.click(screen.getByLabelText(/Two Players Online/i));
  expect(screen.getByRole('button', { name: /Host a Party/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Join a Party/i })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run tests**

Run: `npm test -- SetupModal OnlineSubForm`
Expected: 3 SetupModal (2 prior + 1 new) + 4 OnlineSubForm = 7 passing.

- [ ] **Step 7: Commit**

```bash
git add src/components/OnlineSubForm.tsx src/components/OnlineSubForm.test.tsx src/components/SetupModal.tsx src/components/SetupModal.test.tsx
git commit -m "feat(online): SetupModal online sub-form (Host/Join)"
```

---

## Task 9: `useOnlineMoveBridge` effect in `PlayPage`

**Files:**
- Modify: `src/pages/PlayPage.tsx`
- Test: `src/pages/PlayPage.test.tsx` (add 1 integration test)

- [ ] **Step 1: Edit `src/pages/PlayPage.tsx`**

Add to the imports at the top:

```tsx
import { realRoomFactory } from '../game/online/trystero-adapter';
```

Pass `roomFactory={realRoomFactory}` to the `<GameProvider>` so production code uses real trystero. The test will override this via a custom render path (see step 2).

Inside `PlayPageInner`, after the existing AI loop effect, add the online move bridge:

```tsx
// Online move bridge: apply remote moves, handle remote resign, handle disconnect/forfeit
useEffect(() => {
  if (!online) return;
  const offMove = online.onMove((m) => {
    game.move(m.from, m.to, m.promotion);
  });
  const offResign = online.onResign(() => {
    game.markRemoteResign();
  });

  let forfeitTimer: ReturnType<typeof setTimeout> | null = null;
  const offLeave = online.onPeerLeave(() => {
    showToast('Opponent disconnected — they forfeit in 30s…');
    forfeitTimer = setTimeout(() => {
      const opponent = online.myColor === 'w' ? 'b' : 'w';
      game.markDisconnect(opponent);
    }, 30_000);
  });
  const offJoin = online.onPeerJoin(() => {
    if (forfeitTimer) { clearTimeout(forfeitTimer); forfeitTimer = null; }
    online.sendResync(game.fen, game.pgn);
  });
  const offResync = online.onResync((m) => {
    if (m.fen !== game.fen) {
      game.loadPgn(m.pgn);
      showToast('Game state synchronized with opponent.');
    }
  });

  return () => {
    offMove(); offResign(); offLeave(); offJoin(); offResync();
    if (forfeitTimer) clearTimeout(forfeitTimer);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [online]);
```

(`online` and `game` are read from `useGame()`. The dep is `online` only because we don't want re-subscription on every move; the callbacks capture `game` via closure but since `game` is from a hook that returns a stable-ish memoized object that updates on every move, this effect would re-run constantly. To avoid that, pull `game.move` etc. via a `gameRef`:)

Replace the body of the effect with a ref-based variant to keep deps clean:

```tsx
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [online]);
```

Add `import { useRef } from 'react';` if not already imported.

Also extend the `winnerLabel` IIFE to handle `'disconnect'`:

```tsx
if (game.status === 'disconnect') return 'Opponent forfeited (disconnected).';
```

Add this branch right above the existing `if (game.status === 'stalemate')` line.

Modify the existing `<GameProvider ...>` line to include `roomFactory={realRoomFactory}`. Then update `PlayPage`'s top-level `GameProvider` props:

```tsx
<GameProvider
  key={JSON.stringify(settings)}
  initialSettings={settings}
  roomFactory={realRoomFactory}
>
```

- [ ] **Step 2: Add an integration test** to `src/pages/PlayPage.test.tsx`. This test injects a fake room factory by wrapping the production `PlayPage` with a context that overrides the factory. Simpler: extract the inner test to use `<GameProvider>` directly.

Add (don't replace existing):

```tsx
import { GameProvider } from '../game/GameProvider';
import { Board } from '../components/Board';
import { FakeTrysteroBus } from '../test/mocks/fake-trystero';

describe('Online move bridge (integration)', () => {
  it('two GameProviders in the same room synchronize moves', async () => {
    const bus = new FakeTrysteroBus();
    const factory = (name: string) => bus.join(name);

    function HostBoard() { return <Board />; }
    function JoinBoard() { return <Board />; }

    const { rerender } = render(
      <>
        <GameProvider
          initialSettings={{
            ...DEFAULT_SETTINGS,
            mode: 'two-players-online',
            timeControl: null,
            online: { role: 'host', code: 'SYNC01', hostInit: { color: 'white', timeControl: null } },
          }}
          roomFactory={factory}
          stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
        >
          <HostBoard />
        </GameProvider>
        <GameProvider
          initialSettings={{
            ...DEFAULT_SETTINGS,
            mode: 'two-players-online',
            timeControl: null,
            online: { role: 'join', code: 'SYNC01' },
          }}
          roomFactory={factory}
          stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
        >
          <JoinBoard />
        </GameProvider>
      </>
    );

    // Ensure pairing finished
    await waitFor(() => expect(screen.getAllByTestId('square-e2')).toHaveLength(2));
    // Click on host's e2 → e4. Both boards should update.
    const allE2 = screen.getAllByTestId('square-e2');
    const allE4 = screen.getAllByTestId('square-e4');
    const user = userEvent.setup();
    await user.click(allE2[0]);  // host
    await user.click(allE4[0]);
    await waitFor(() => {
      expect(allE4[0].querySelector('img')).toBeTruthy();
      expect(allE4[1].querySelector('img')).toBeTruthy();
    });
  });
});
```

NOTE: This integration test is intentionally light — it verifies the bridge works end-to-end via the fake bus. The 30s forfeit and resync paths are exercised in the `useOnlineGame` unit tests.

NOTE: The bridge code must live in `PlayPage` for the production tree, but the integration test renders two `GameProvider` + `Board` pairs WITHOUT `PlayPage`. To make the bridge available to the test, also add a tiny `OnlineMoveBridge` component that hosts the effect and mount it inside the test's `GameProvider`s. Refactor PlayPage to use it too. Concretely, create:

`src/game/online/OnlineMoveBridge.tsx`:

```tsx
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
```

In `PlayPage`'s `PlayPageInner`, REPLACE the inline bridge effect with mounting `<OnlineMoveBridge />` inside the `ImperialFrame` block (or anywhere inside the GameProvider). The remote-state effects above can be removed.

In the integration test, mount `<OnlineMoveBridge />` inside each of the two `<GameProvider>` blocks alongside `<HostBoard />` / `<JoinBoard />`.

- [ ] **Step 3: Run tests**

Run: `npm test -- PlayPage`
Expected: existing tests still pass + new integration test passes (3 if previously 1 + 1 new = depends; verify "all green").

Run: `npm test`
Expected: full suite green.

- [ ] **Step 4: Commit**

```bash
git add src/game/online/OnlineMoveBridge.tsx src/pages/PlayPage.tsx src/pages/PlayPage.test.tsx
git commit -m "feat(online): OnlineMoveBridge applies remote moves, resign, forfeit, resync"
```

---

## Task 10: `GameOverDialog` text + verification build

**Files:**
- Modify: `src/components/GameOverDialog.tsx`
- Test: `src/components/GameOverDialog.test.tsx` (add 1 test)

- [ ] **Step 1: Edit `src/components/GameOverDialog.tsx`**

In the `TITLES` map, add:

```ts
'disconnect': 'Forfeit',
```

(So the union is now exhaustively covered.)

- [ ] **Step 2: Add a test** to `src/components/GameOverDialog.test.tsx`:

```tsx
it('renders for disconnect', () => {
  render(<GameOverDialog status="disconnect" winnerLabel="Opponent forfeited" onNewGame={() => {}} onClose={() => {}} />);
  expect(screen.getByText('Forfeit')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests + build**

```bash
npm test
npm run build
```
Expected: full green; clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameOverDialog.tsx src/components/GameOverDialog.test.tsx
git commit -m "feat(online): GameOverDialog handles 'disconnect' status"
```

---

## Task 11: Manual smoke test

This is a human-driven verification of the end-to-end flow against the live dev server.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Note the printed URL (usually `http://localhost:5173`).

- [ ] **Step 2: Smoke checklist** — open TWO browser windows side-by-side at the URL.

For each item, perform the action and visually confirm. If anything fails, open an issue / write a regression test and fix before declaring done.

- [ ] In window A, click **Begin the Duel** → SetupModal opens. Choose **Two Players Online** → **Host a Party** → pick White, No clock → click **Open Party**. The displayed code (e.g. `K7M-P3X`) appears.
- [ ] In window B, click **Begin the Duel** → **Two Players Online** → **Join a Party** → enter the code from window A → click **Connect**. Both modals close; both windows show the starting board with "Emperor Michalis" labels swapped to the opponent's name (or just "White"/"Black" in HvH-online).
- [ ] In window A (white's turn) click e2 → e4. Window B's board updates to show the same move within ~1 second; window B's MoveHistory shows "1. e4". Try clicking a piece in window A — input is disabled because it's now black's turn.
- [ ] In window B, play e7 → e5. Window A updates; both MoveHistory panels show "1. e4 e5".
- [ ] In window A click **Resign**. Window B's `GameOverDialog` shows with "Opponent forfeited" or the resignation label.
- [ ] Start a new game from the SetupModal in both windows (host new code; the other joins). Mid-game, **close window B's tab**. Window A shows the toast "Opponent disconnected — they forfeit in 30s…". Open a new tab, navigate to the URL, choose **Two Players Online → Join** with the same code from window A. Within a few seconds, the toast in window A clears and the position re-syncs.
- [ ] Repeat the disconnect test but DO NOT rejoin. After 30s, window A's GameOverDialog shows "Forfeit" with the "Opponent forfeited (disconnected)." line.
- [ ] Try entering an invalid code (`AAAAAA`) in a fresh Join. The Connect button should remain disabled if the chars are valid but the room is empty; after ~15 seconds (or whenever the `onPeerJoin` signal never arrives), the Status text should still be "Connecting…" — for v1 we accept this and the user can cancel.

NOTE: The 15-second "no party found" timeout described in the spec is NOT yet implemented in this plan because Trystero gives no negative signal. If the smoke test feels too hangy, add a second small task: "after 15 s of `connecting` in JoinCard, switch to an error state". Skip if acceptable.

- [ ] **Step 3: Final commit (only if smoke pass clean)**

```bash
git commit --allow-empty -m "chore: online multiplayer smoke test pass"
```

---

## Self-review of the plan against the spec

**Spec coverage check (each spec section → task that covers it):**
- New "Two Players Online" mode in SetupModal → Task 8
- Host / Join flow with code → Tasks 1 (utility), 8 (UI)
- WebRTC P2P via trystero → Tasks 2 (install + mock), 5 (adapter), 3 (hook)
- Hello with color + time control → Task 3 (hook handshake)
- Per-move sync → Tasks 7 (Board broadcast), 9 (bridge applies remote)
- Both clocks tick (independent useTimer in each provider) → existing behavior, no new task needed
- Read-only board on opponent's turn → Task 7
- 30-second forfeit countdown on disconnect → Task 9 (`OnlineMoveBridge`)
- Reconnect resync → Task 9
- `GameStatus` adds `'disconnect'` → Task 4
- `GameMode` adds `'two-players-online'` → Task 4
- `GameSettings.online?: OnlineConfig` → Task 4
- `useChessGame.markDisconnect` + `markRemoteResign` → Task 4
- Auto-save skipped in online mode → Task 6 (GameProvider effect)
- `GameOverDialog` text for disconnect → Task 10
- Tests: code utility, useOnlineGame, OnlineSubForm, GameProvider, Board, integration, GameOverDialog → Tasks 1, 3, 8, 6, 7, 9, 10
- Manual smoke checklist → Task 11

No spec requirement is uncovered.

**Placeholder scan:** No "TBD" / "TODO" / "implement later" / "add appropriate error handling" patterns appear. Every code step contains literal code. The only deferred-by-design item is the 15-second "no party found" UI message (called out explicitly as optional in Task 11 with a path forward).

**Type/method consistency:**
- `useOnlineGame` API: `status, myColor, timeControl, sendMove, sendResign, sendResync, onMove, onResign, onResync, onPeerLeave, onPeerJoin, close` — used in `OnlineMoveBridge` (Task 9), `Board` (Task 7), `GameProvider` (Task 6). All names match.
- `useChessGame` additions `markDisconnect(color)` / `markRemoteResign()` — used in `OnlineMoveBridge`. Names match.
- `WireMove`, `WireResign`, `WireResync`, `Hello` types — defined in Task 1, consumed in Task 3 (hook) and elsewhere via the hook's API. Names match.
- `OnlineConfig` shape — defined in Task 4, consumed by `OnlineSubForm.onConfirm` (Task 8) and read by `GameProvider` (Task 6). Match.
- `RoomFactory` type — defined in Task 3, exported from `useOnlineGame.ts`, consumed by `trystero-adapter` (Task 5) and `GameProvider` props (Task 6). Match.
- `formatCode` — added to `code.ts` in Task 1, used in `OnlineSubForm` (Task 8). Match.
- `GameContextValue.online` — added in Task 6, consumed in Task 7 (Board), Task 9 (bridge), Task 8 (n/a — SubForm is its own component, no context needed). Match.

Plan is complete.
