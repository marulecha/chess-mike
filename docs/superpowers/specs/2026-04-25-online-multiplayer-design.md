# Online Multiplayer (Shared Code) — Design

**Date:** 2026-04-25
**Status:** Approved
**Type:** Feature addition to Michalis Chess Master

## Summary

Add a third game mode, **Two Players Online**, that lets two browsers play a chess game together over a peer-to-peer WebRTC connection coordinated by a 6-character shared code. One player hosts a party (gets a code), the other joins by entering it. The site remains fully static — no backend is added. Networking uses [`trystero`](https://github.com/dmotz/trystero), which provides WebRTC mesh rooms via free public signaling (BitTorrent trackers by default, with Nostr/MQTT fallbacks).

## Goals

- A new "Two Players Online" mode selectable from the existing SetupModal.
- Pairing UX: Host generates a code; Joiner enters it; once connected, the game starts.
- Standard chess-rules online game: same `chess.js` rules, same UI, both clocks tick.
- Robust to one peer disconnecting (30-second forfeit countdown with reconnect).
- Site stays 100% static — no API keys, no backend service we own.

## Non-goals

- No spectators, no chat, no tournaments, no matchmaking, no global lobby.
- No undo (would require a trust-based "request undo" flow; not worth it for v1).
- No save/resume of online games (P2P session can't survive a refresh).
- No NAT traversal beyond what WebRTC + public STUN gives you. Corporate firewalls that block UDP are accepted as out-of-scope.
- No host-authoritative clock (drift is bounded by the move cadence; defer if it ever matters).

## Tech additions

- `trystero` (~5 KB, MIT) — added to `dependencies`.
- One new hook: `useOnlineGame`.
- One new utility module: `src/game/online/code.ts` (generate / normalize / validate codes).
- One new wire-protocol module: `src/game/online/protocol.ts` (message types + sender/receiver helpers).
- One new test mock: `src/test/mocks/fake-trystero.ts` (in-memory pub/sub).
- Modifications: `SetupModal`, `GameProvider`, `PlayPage`, `Board`, `usePersistence`, type definitions.

## UX flow

The SetupModal's "Opponent" group gains a third radio: **Two Players Online**. Selecting it replaces the difficulty / play-as / time-control sub-form with the **online sub-form**:

```
┌─ Two Players Online ──────────────────┐
│                                       │
│  ○ Host a Party     ○ Join a Party    │
│                                       │
│  ── if Host ─────────────────         │
│  Color:  [White] [Black] [Random]     │
│  Time:   [No clock ▾]                 │
│  Code:   K7-MP3X     [Copy]           │
│  ⏳ Waiting for opponent…              │
│                                       │
│  ── if Join ─────────────────         │
│  Code:   [_____________]              │
│         [Connect]                     │
│  Status: Connecting…                  │
└───────────────────────────────────────┘
                      [Cancel]  [Begin]
```

- **Host flow:** Pick Host → color + time control selectors appear → a code is generated and displayed with a Copy button → status reads "Waiting for opponent…" → as soon as the joiner connects, the modal closes and the game begins. The "Begin the Duel" button is disabled while waiting (start happens automatically on connect).
- **Join flow:** Pick Join → code input + Connect button → on Connect, status reads "Connecting…" then "Pairing…" then game starts. No color/time-control choices on the joiner side — those come from the host.
- **Cancel** at any stage tears down the Trystero room.

### Code format

- Alphabet: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no `0/O/1/I/L`).
- 6 characters, displayed as `XXX-XXX` (one dash for readability).
- Case-insensitive on input; normalize to upper-case + strip dashes before joining.
- Trystero room name: `michalis-chess-master:` + the 6-character code (the prefix scopes the namespace).

## Networking

### Library

`trystero` configured with the default BitTorrent-tracker strategy. App ID = `michalis-chess-master`. The `Room` is created lazily by `useOnlineGame`.

### Hook: `useOnlineGame`

```ts
type OnlineRole = 'host' | 'join';
type OnlineStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'closed';

type HostInit = {
  color: 'white' | 'black' | 'random';
  timeControl: TimeControl | null;
};

type Hello = {
  color: 'w' | 'b';                    // the joiner's color, decided by host
  timeControl: TimeControl | null;
};

type WireMove   = { type: 'move'; from: Square; to: Square; promotion?: Promotion };
type WireResign = { type: 'resign' };
type WireResync = { type: 'resync'; fen: string; pgn: string };
type WireMsg    = Hello | WireMove | WireResign | WireResync;

type UseOnlineGameApi = {
  status: OnlineStatus;
  myColor: 'w' | 'b' | null;            // null until paired
  timeControl: TimeControl | null;       // null until paired (joiner) or set immediately (host)
  sendMove: (m: { from: Square; to: Square; promotion?: Promotion }) => void;
  sendResign: () => void;
  sendResync: (fen: string, pgn: string) => void;
  onMove: (cb: (m: WireMove) => void) => () => void;       // returns unsubscribe
  onResign: (cb: () => void) => () => void;
  onResync: (cb: (m: WireResync) => void) => () => void;
  onPeerLeave: (cb: () => void) => () => void;
  onPeerJoin:  (cb: () => void) => () => void;
  close: () => void;
};

function useOnlineGame(opts: {
  role: OnlineRole;
  code: string;
  hostInit?: HostInit;     // required when role==='host'
  trysteroFactory?: TrysteroFactory; // injected for tests
}): UseOnlineGameApi;
```

### Pairing handshake

1. Host calls `joinRoom({ appId: 'michalis-chess-master' }, code)` → status `'waiting'`.
2. Joiner does the same → status `'connecting'`.
3. Trystero fires `onPeerJoin` on both sides.
4. Host decides colors:
   - `random` → 50/50 coin flip.
   - Otherwise host gets the picked color, joiner gets the other.
5. Host sends `Hello { color: <joinerColor>, timeControl }`.
6. Joiner receives Hello → records `myColor`, sets time control → status `'connected'`.
7. Host sets status `'connected'` after Hello is sent.

### Per-move flow

- Local player makes a move via the existing Board UX → `useChessGame.move(...)` runs → on success, `PlayPage` (or a small new `useOnlineMoveBridge` effect) calls `online.sendMove({...})`.
- Remote peer receives via `onMove` → calls `useChessGame.move(...)` with the same arguments.
- Both `chess.js` instances stay in lockstep. Existing UI updates (history, captures, clock switch, last-move highlight) flow through unchanged.

### Resync (only after a reconnect)

When a previously-disconnected peer rejoins (`onPeerJoin` fires while `myColor !== null`), each side sends `Resync { fen, pgn }`. If the two PGNs match, life continues. If they disagree (shouldn't happen in normal play), the **joiner** adopts the **host**'s state via `useChessGame.loadPgn`. A toast announces the rewind.

### Wire protocol JSON shape

All messages are JSON-serialized objects with a `type` field. Trystero handles the framing. Example:

```json
{ "type": "move", "from": "e2", "to": "e4" }
{ "type": "move", "from": "h7", "to": "h8", "promotion": "q" }
{ "type": "resign" }
```

## Type changes

```ts
// src/types/chess.ts

export type GameMode = 'human-vs-human' | 'human-vs-ai' | 'two-players-online';

export type GameStatus =
  | 'idle' | 'in-progress'
  | 'checkmate' | 'stalemate' | 'draw'
  | 'resigned' | 'timeout'
  | 'disconnect';                       // NEW: opponent forfeited by disconnecting

export type OnlineConfig = {
  role: 'host' | 'join';
  code: string;
  hostInit?: { color: 'white' | 'black' | 'random'; timeControl: TimeControl | null };
};

export type GameSettings = {
  mode: GameMode;
  aiDifficulty: Difficulty;
  playerColor: 'white' | 'black';        // unused in online mode (color comes from hello)
  timeControl: TimeControl | null;
  boardOrientation: Orientation;
  online?: OnlineConfig;                 // present only when mode === 'two-players-online'
};
```

## Component changes

### `SetupModal`

- Add `'two-players-online'` to the Opponent radio group.
- When selected, render the **online sub-form** (Host / Join cards described above).
- Suppress the difficulty / play-as / time-control sections in online mode.
- The "Begin the Duel" button is replaced by automatic start on `'connected'` for online mode. The Cancel button now also calls `online.close()` if a Trystero room was created.

### `GameProvider`

- Optionally accept an `online: UseOnlineGameApi` prop (or instantiate `useOnlineGame` itself when `settings.mode === 'two-players-online'`). Decision: instantiate inside the provider so consumers don't have to thread it through. Export `useGame()` to expose `online: UseOnlineGameApi | null` as a context field.
- Auto-save effect: skip when `settings.mode === 'two-players-online'`.

### `PlayPage`

- Add a new effect: `useOnlineMoveBridge`.
  - Subscribes to `online.onMove` → applies remote moves via `game.move(...)`. The bridge does **not** send these moves back; only the local-input path sends.
  - Subscribes to `online.onResign` → calls `game.markRemoteResign()` (sets status `'resigned'` on behalf of the opponent).
  - Subscribes to `online.onPeerLeave` → starts a 30-second timer; on expiry calls `game.markDisconnect(opponentColor)`.
  - Subscribes to `online.onPeerJoin` (after a previous leave) → cancels the disconnect timer and calls `online.sendResync(game.fen, game.pgn)`.
- **Local-move broadcasting** lives in the `Board` component (the only place a local user can produce a move): after a successful `game.move(...)` in any of the click/drag/promotion paths, if `mode === 'two-players-online'`, call `online.sendMove(lastMove)`. Centralizing it in `Board` (rather than the bridge) makes "remote moves don't echo" structurally obvious — the bridge writes to `game`, and only `Board` writes to `online`.
- The existing AI loop is already gated on `mode === 'human-vs-ai'`; no change.
- `GameOverDialog` rendering: add a label for `status === 'disconnect'` → "Opponent forfeited (disconnected)."

### `Board`

- One small change: when `mode === 'two-players-online'` and `game.turn !== online.myColor`, treat the board as **read-only** (don't allow click selection or drag start). All other behavior (last-move highlight, in-check highlight) stays.

### `useChessGame`

- Add `markDisconnect(color: Color)` method (sets override status to `'disconnect'`).
- Add `markRemoteResign()` method (sets override status to `'resigned'`, identical to `resign()` but named to signal intent at the call site).

### `usePersistence`

- `save(blob)` callers (in `GameProvider`) gate the call on `settings.mode !== 'two-players-online'`. The `usePersistence` hook itself stays unchanged.

## File layout (additions)

```
src/
  game/
    online/
      useOnlineGame.ts          # the hook
      code.ts                   # generate / normalize / validate
      protocol.ts               # WireMsg types and helpers
  test/
    mocks/
      fake-trystero.ts          # in-memory pub/sub used in tests
```

## Error handling

- **Trystero fails to load** (e.g., network blocks all signaling backends): `useOnlineGame` resolves to status `'disconnected'` after a 15-second timeout; the SetupModal shows "Couldn't connect to the matchmaking network. Try again or play locally."
- **Joiner enters a code, no host appears within 15s**: status `'disconnected'`; SetupModal shows "No party found with that code."
- **Code fails validation** (wrong length / illegal chars): inline error in the input; Connect button stays disabled.
- **Remote move rejected by local `chess.js`** (would mean desync): show toast "Game out of sync — ending match." and set status to `'disconnect'`.
- **Browser unload during an online game**: nothing fancy — the peer sees us disappear and the 30s forfeit kicks in for them. We don't try to reconnect on next visit (no save).

## Testing

- **Unit (`code.test.ts`):**
  - `generateCode()` returns 6 chars from the allowed alphabet.
  - `normalizeCode('k7-mp3x ')` → `'K7MP3X'`.
  - `isValidCode('K7MP3X')` → true; `'K7MP3O'` (contains `O`) → false; `'K7MP3'` (too short) → false.
- **Unit (`useOnlineGame.test.ts`):**
  - With a fake Trystero, two hosts in the same room exchange a hello; both end at status `'connected'` with mirrored `myColor`.
  - `sendMove` → both `onMove` callbacks fire on the peer.
  - `onPeerLeave` triggers status `'disconnected'`; subsequent `onPeerJoin` returns to `'connected'`.
  - 30s forfeit timer logic (drive with fake timers).
- **Integration (`OnlineGame.integration.test.tsx`):**
  - Mount two `<GameProvider mode="two-players-online">` in the same React tree sharing one fake Trystero.
  - Make a move on side A → side B's `MoveHistory` shows the move.
  - Side A resigns → side B's `GameOverDialog` shows.
  - Side A disconnects → side B's countdown starts → on rejoin, countdown clears and PGNs match.
- **Manual smoke** (final gate before declaring done):
  - Open two browser windows. Host in one, join in the other with the shown code. Play a 5-move opening from each side. Verify boards stay in sync and clocks tick correctly.
  - Resign as Joiner; verify Host sees "Joiner resigns".
  - Refresh the Joiner's tab mid-game; verify Host's countdown starts; rejoin within 30s and confirm both boards resync.
  - Try entering a bogus code on the Join side; verify the "No party found" message after 15s.

## Open questions / deferred decisions

- **Reconnect identity:** v1 treats any peer rejoining the same room as the original opponent. If you wanted to prevent a third party from grabbing the slot, we'd add a per-session token in the hello and require it on rejoin. Defer.
- **Host-authoritative clock** to eliminate drift: defer until users complain.
- **Sound on opponent move** (a small "tick"): defer with the rest of the audio backlog.
- **Spectator mode:** explicitly out of scope.
