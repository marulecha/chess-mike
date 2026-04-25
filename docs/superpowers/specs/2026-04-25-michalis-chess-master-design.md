# Michalis Chess Master — Design

**Date:** 2026-04-25
**Status:** Approved
**Type:** New project (greenfield)

## Summary

A fully client-side, browser-based chess website themed as an "Imperial" duel against Michalis (depicted as Napoleon). Two pages: an ornate landing page and a play page. Supports Human vs Human (local) and Human vs AI (Stockfish). Includes move history, undo, captured pieces, legal-move highlights, AI difficulty levels, chess clock, save/resume via localStorage, and board flip. No backend.

## Goals

- A polished, distinctive chess website with a strong "Imperial" identity that uses the existing Napoleon portrait of Michalis as its visual centerpiece.
- A correct, complete chess implementation (all standard rules including castling, en passant, promotion, threefold repetition, fifty-move rule, insufficient material).
- A genuine AI opponent (Stockfish) with three meaningful difficulty levels.
- Smooth UX: drag-and-drop and click-to-move both work; AI never blocks the UI thread.
- Mid-game refresh-resume "just works" via localStorage.

## Non-goals

- No multiplayer over the network. No accounts. No backend.
- No opening explorer, no engine analysis lines, no PGN import/export UI (PGN is used internally for save/resume only).
- No mobile-first redesign — the layout should be usable on tablet/desktop; phone is a stretch goal, not a requirement.
- No tournament/ELO tracking.

## Tech stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** for styling, with a small `theme.css` for one-off ornate flourishes
- **react-router-dom** for the two routes
- **`chess.js`** for rules, move generation/validation, SAN/PGN, terminal-state detection
- **`stockfish`** (WASM build) running inside a Web Worker for AI
- **Vitest + @testing-library/react** for tests
- Open-source **Cburnett** SVG piece set (CC BY-SA), bundled in `public/pieces/`

## Pages

### `/` — Home
Imperial hero. Left half: title "Michalis Chess Master" in Cormorant Garamond serif with letter-spacing, tagline "Challenge the Emperor of the 64 Squares," primary CTA "Begin the Duel" → routes to `/play`. Right half: the Napoleon portrait of Michalis in a gold oval frame with a soft warm drop shadow. Background: deep navy with a faint damask SVG pattern. Footer: a single line of small print.

### `/play` — Game
The board centered with an ornate gold frame. Side panels:
- Left: `PlayerCard` for black (clock + captured pieces), `MoveHistory`.
- Right: `PlayerCard` for white, `ControlsPanel` (New, Undo, Resign, Flip), `AIThinkingIndicator`.
- Top of page: `ResumeBanner` if a saved game < 7 days old exists.
- `SetupModal` opens on first visit and on "New Game".
- `GameOverDialog` opens on terminal state or resignation.

## Component tree (Play page)

```
<PlayPage>
  <GameProvider>
    <SetupModal />
    <ResumeBanner />
    <ImperialFrame>
      <SidePanel side="left">
        <PlayerCard color="black" />
        <MoveHistory />
      </SidePanel>
      <Board>
        <Square /> x64
        <Piece />  // SVG, drag + click handlers
      </Board>
      <SidePanel side="right">
        <PlayerCard color="white" />
        <ControlsPanel />
        <AIThinkingIndicator />
      </SidePanel>
    </ImperialFrame>
    <GameOverDialog />
  </GameProvider>
</PlayPage>
```

Move input supports **both** click-to-select-then-click-target and HTML5 drag-and-drop. No extra DnD library.

## State architecture

State lives in a `GameProvider` React Context, populated by custom hooks:

- `useChessGame` — owns a `Chess()` ref; exposes `move(from, to, promotion?)`, `undo()`, `legalMovesFrom(square)`, `fen()`, `pgn()`, `history()`, `status()`, plus a serial `moveCount` to drive re-renders.
- `useStockfish` — lazily instantiates the Stockfish Web Worker; exposes `requestMove(fen, difficulty): Promise<{from, to, promotion?}>` and `aiThinking: boolean`. Handles UCI handshake.
- `useTimer` — per-side clock with switchable active side, increment support, and a tick interval; emits `flagged` (time-out) events.
- `usePersistence` — debounced save to localStorage on every successful move; load on mount; clear on game-over or explicit reset.

### State shape

```ts
type GameSettings = {
  mode: 'human-vs-human' | 'human-vs-ai';
  aiDifficulty: 'easy' | 'medium' | 'hard';
  playerColor: 'white' | 'black';                 // only used in vs-ai
  timeControl: { initialMs: number; incrementMs: number } | null; // null = no clock
  boardOrientation: 'white' | 'black';
};

type GameState = {
  fen: string;
  pgn: string;
  history: Move[];
  status: 'idle' | 'in-progress' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  turn: 'w' | 'b';
  inCheck: boolean;
  legalMovesCache: Record<Square, Square[]>;
};

type UIState = {
  selectedSquare: Square | null;
  draggingFrom: Square | null;
  promotionPending: { from: Square; to: Square } | null;
  aiThinking: boolean;
  clock: { whiteMs: number; blackMs: number; runningSide: 'w' | 'b' | null };
};
```

## Game loop (one move)

1. User clicks/grabs a piece. `Board` queries `useChessGame.legalMovesFrom(square)` → `UIState.selectedSquare` set, legal targets highlighted.
2. User releases on a target. `useChessGame.move(from, to)` calls `chess.js`. If the move would be a promotion, instead set `UIState.promotionPending` and show the promotion picker (Q/R/B/N styled with imperial accents). On user choice, call `move(from, to, choice)`.
3. On success: `GameState` updates, `MoveHistory` re-renders, `CapturedPieces` updates, `Clock` switches sides, `usePersistence` writes to localStorage.
4. If mode is `human-vs-ai` and it is now the AI's turn: `useStockfish.requestMove(fen, difficulty)` → `AIThinkingIndicator` shows. Worker replies with `bestmove` UCI string → hook applies it via the same `move()` path.
5. After every move, check terminal state. On terminal: stop clocks, set `status`, open `GameOverDialog`, and clear the saved game.

## Stockfish difficulty mapping

| Level   | Skill Level | movetime |
|---------|-------------|----------|
| Easy    | 3           | 200 ms   |
| Medium  | 10          | 700 ms   |
| Hard    | 20          | 1500 ms  |

Sent via UCI `setoption name Skill Level value <n>` then `position fen <fen>` then `go movetime <ms>`.

## Persistence

- Key: `michalis-chess-master:save-v1`. Value: `{ pgn, settings, clock, savedAt }`.
- Written after every successful move (including AI moves).
- On `/play` mount: if a save exists and `savedAt` is < 7 days old, render `ResumeBanner`. User can Resume or Discard.
- Cleared on game-over, on explicit "New Game", and on Discard.
- A separate key `michalis-chess-master:prefs-v1` persists last-used `GameSettings` (theme, difficulty, time control) across sessions.

## Visual language

### Palette
- `imperial-navy` `#0E1B3A` — primary background
- `imperial-burgundy` `#6B1B2A` — accent / dark squares on board
- `imperial-gold` `#C9A24C` — borders, headings, accents
- `imperial-cream` `#F4ECD8` — light squares, body backgrounds in cards
- `imperial-ink` `#1B1410` — body text on cream
- `imperial-shadow` `rgba(20, 12, 4, 0.55)` — warm depth shadow

### Typography
- Headings: **Cormorant Garamond** (500/700)
- Body: **EB Garamond**
- Move notation / clock: **JetBrains Mono** (tabular numbers)
- All loaded from Google Fonts via `<link>` in `index.html`

### Board
- Light squares `imperial-cream`, dark squares `imperial-burgundy`.
- Ornate gold frame: thick `imperial-gold` border with stacked CSS `box-shadow` rules and small SVG fleur-de-lis / laurel corner flourishes.
- Coordinates (a–h, 1–8) etched in gold around the frame.
- Highlights:
  - Selected square: gold inner glow.
  - Legal target (empty): small gold dot.
  - Legal target (capture): gold ring.
  - Last move (from + to): subtle gold square highlight.
  - Check: red glow on the king's square.

### Pieces
Cburnett SVG set, served from `public/pieces/`. One `<img>` per square.

### Buttons
Gold border + cream text on navy, soft gold glow on hover. Primary CTA "Begin the Duel" is larger with a subtle gradient.

### Hero (Home)
Left half: title + tagline + CTA on dark navy with faint damask SVG pattern. Right half: `michalis-napoleon.png` portrait in a gold oval frame with drop shadow.

### Image asset
A copy of the user's `michalis-napoleon.png` is placed at `public/img/michalis-napoleon.png`. Per user instruction, the project does not read live from external directories; the file is copied in once during setup.

### Atmosphere flourishes
Small SVG eagles / laurel wreaths as section dividers. Subtle vignette on page edges. Restrained — museum plaque, not theme park.

## Error handling

- **Stockfish worker fails to load** (old browser, blocked WASM): catch in `useStockfish` init; surface non-blocking toast — "The Emperor's strategist is unavailable; only Human vs Human duels can be played." Disable the AI option in `SetupModal`.
- **AI returns no/illegal move** (defensive): re-issue once; on second failure, show "AI error — please start a new game."
- **localStorage save fails** (quota / private mode): swallow silently; disable the Resume banner; warn once via toast.
- **Corrupted save** (bad JSON, or PGN that `chess.js` rejects): clear the key and start a fresh game.
- **Promotion picker dismissed**: treat as cancel — revert the in-flight selection and re-highlight.
- **Browser unload mid-game**: persistence already happens after each move, so refresh-resume is automatic.
- **Time-out**: when a clock hits 0, set `status = 'in-progress' → terminal` with a "<color> ran out of time" reason; show `GameOverDialog`. Insufficient-material-on-flag rule is honored (no win on time if the opponent has insufficient mating material — `chess.js` exposes the predicate).

## Testing

- **Vitest + @testing-library/react** for components:
  - Board renders 64 squares with correct colors and coordinates.
  - Clicking a piece highlights its legal targets.
  - Promotion picker appears on a 7th-rank pawn move and applies the chosen piece.
  - `ResumeBanner` shows iff a valid save exists and age < 7 days.
  - `GameOverDialog` shows on each terminal state.
- **Plain Vitest** unit tests for hooks:
  - `useChessGame.move` rejects illegal moves and accepts legal ones; undo restores prior state.
  - `usePersistence` round-trips a PGN and rejects corrupted JSON.
  - Clock decrement math, increment-on-move, and flag detection.
  - Difficulty → UCI option mapping.
- **Mock the Stockfish worker** in tests via a fake worker that returns canned `bestmove` responses — keeps tests fast and deterministic.
- **Manual smoke checklist** before declaring done:
  - Play a full game vs each AI difficulty.
  - Undo a move (both colors).
  - Resign mid-game.
  - Force checkmate, stalemate, threefold repetition, fifty-move draw.
  - Refresh mid-game and Resume.
  - Discard a saved game.
  - Flip the board.
  - Swap colors against AI (AI plays white).
  - Run out the clock for each side.
  - Promote a pawn to each of Q/R/B/N.
  - En passant capture.
  - Both castling sides for both colors.

## File layout

```
michalis-games/
  docs/superpowers/specs/2026-04-25-michalis-chess-master-design.md
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  public/
    img/michalis-napoleon.png
    pieces/{wK,wQ,wR,wB,wN,wP,bK,bQ,bR,bB,bN,bP}.svg
    stockfish/stockfish.wasm           # served as a static asset
    stockfish/stockfish.worker.js
  src/
    main.tsx
    App.tsx
    routes.tsx
    pages/
      HomePage.tsx
      PlayPage.tsx
    game/
      GameProvider.tsx
      hooks/
        useChessGame.ts
        useStockfish.ts
        useTimer.ts
        usePersistence.ts
      stockfish/
        worker-client.ts               # wraps the Web Worker UCI protocol
        difficulty.ts                  # level → {skill, movetime}
    components/
      ImperialFrame.tsx
      Board.tsx
      Square.tsx
      Piece.tsx
      MoveHistory.tsx
      CapturedPieces.tsx
      PlayerCard.tsx
      Clock.tsx
      ControlsPanel.tsx
      SetupModal.tsx
      ResumeBanner.tsx
      GameOverDialog.tsx
      PromotionPicker.tsx
      AIThinkingIndicator.tsx
      Toast.tsx
    styles/
      index.css
      theme.css                        # ornate flourishes outside Tailwind
    types/
      chess.ts                         # Square, Color, Move re-exports
    test/
      setup.ts
      mocks/fake-stockfish.ts
```

## Open questions / deferred decisions

- **Sound effects** (move, capture, check, game-over): not in scope for v1. Easy to add later by gating on a settings toggle.
- **Mobile/touch tuning**: layout will be usable but not optimized; revisit after v1.
- **Accessibility**: keyboard-only board navigation is a stretch goal; ensure ARIA labels on squares and buttons in v1.
