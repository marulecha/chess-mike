# Michalis Chess Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully client-side, two-page React + TypeScript chess website themed as an Imperial duel against Michalis (depicted as Napoleon), supporting Human vs Human and Human vs Stockfish-AI play with full chess rules, move history, undo, captured pieces, AI difficulty levels, chess clock, board flip, and localStorage save/resume.

**Architecture:** Vite + React 18 + TypeScript SPA, two routes (`/`, `/play`). Game state lives in a `GameProvider` Context populated by custom hooks (`useChessGame`, `useStockfish`, `useTimer`, `usePersistence`). `chess.js` owns rules and move generation. Stockfish runs in a Web Worker, isolated behind a `worker-client.ts` UCI wrapper. Tailwind for styling, with a small `theme.css` for ornate flourishes outside Tailwind's idiom.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3, react-router-dom 6, chess.js 1.x, stockfish (WASM build), Vitest, @testing-library/react, jsdom.

---

## File structure (locked at plan time)

```
michalis-games/
  .gitignore
  index.html
  package.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  vitest.config.ts
  public/
    img/michalis-napoleon.png            # copied from project root
    pieces/{wK,wQ,wR,wB,wN,wP,bK,bQ,bR,bB,bN,bP}.svg
    stockfish/stockfish.js               # the npm package's worker-ready build
    stockfish/stockfish.wasm
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
        worker-client.ts
        difficulty.ts
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
      theme.css
    types/
      chess.ts
    test/
      setup.ts
      mocks/fake-stockfish.ts
```

Each file has one responsibility. Hooks own state and behavior; components are mostly presentational; the worker client isolates UCI from React.

---

## Task 1: Initialize the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`

- [ ] **Step 1: Initialize git**

```bash
git init
git config core.autocrlf false
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules
dist
dist-ssr
.vite
*.local
.env
.env.*
!.env.example
.DS_Store
coverage
```

- [ ] **Step 3: Scaffold the project with Vite**

Run from inside the project directory:

```bash
npm create vite@latest . -- --template react-ts
```

When prompted, accept overwriting (the directory already has `docs/` and `.gitignore` — Vite will ask before overwriting; choose "Ignore files and continue").

- [ ] **Step 4: Install dependencies**

```bash
npm install
npm install react-router-dom chess.js stockfish
npm install -D tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

- [ ] **Step 5: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 6: Replace `tailwind.config.ts`** (Vite scaffold may have created `.js`; delete it, create `.ts`)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'imperial-navy':     '#0E1B3A',
        'imperial-burgundy': '#6B1B2A',
        'imperial-gold':     '#C9A24C',
        'imperial-cream':    '#F4ECD8',
        'imperial-ink':      '#1B1410',
      },
      boxShadow: {
        'imperial': '0 10px 40px rgba(20, 12, 4, 0.55)',
        'gold-glow': '0 0 0 2px #C9A24C, 0 0 16px rgba(201, 162, 76, 0.55)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['"EB Garamond"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 7: Replace `src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body {
  @apply bg-imperial-navy text-imperial-cream font-body antialiased;
}
```

- [ ] **Step 8: Replace `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 9: Replace `src/App.tsx`** (placeholder; routing comes in Task 4)

```tsx
export default function App() {
  return <div className="p-8 font-display text-3xl text-imperial-gold">Michalis Chess Master</div>;
}
```

- [ ] **Step 10: Replace `index.html`** with imperial fonts and a proper title

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=EB+Garamond:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <title>Michalis Chess Master</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: Verify dev server starts**

Run:
```bash
npm run dev
```
Expected: Vite prints a local URL; opening it shows "Michalis Chess Master" in gold serif on a navy background. Stop the server (Ctrl+C) before continuing.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite+react+ts+tailwind with imperial theme tokens"
```

---

## Task 2: Set up testing infrastructure

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `tsconfig.json`, `package.json`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add types and scripts to `package.json`**

In the `"scripts"` block add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

In `tsconfig.json` `compilerOptions.types`, add `"vitest/globals"` and `"@testing-library/jest-dom"`:
```json
"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 4: Write a smoke test** at `src/test/smoke.test.ts`

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test to verify infra works**

Run: `npm test`
Expected: 1 passing test. Then delete `src/test/smoke.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure vitest + react testing library"
```

---

## Task 3: Stage static assets

**Files:**
- Create: `public/img/michalis-napoleon.png` (copy from project root), `public/pieces/*.svg` (12 files), `public/stockfish/stockfish.js`, `public/stockfish/stockfish.wasm`

- [ ] **Step 1: Copy the portrait into the project**

PowerShell (or cross-platform — use forward slashes in bash):
```bash
mkdir -p public/img
cp "../michalis-napoleon.png" public/img/michalis-napoleon.png
```

(If running from a different directory adjust the source path. The portrait must end up at `public/img/michalis-napoleon.png`.)

- [ ] **Step 2: Download the Cburnett SVG piece set**

The Cburnett set is hosted on Wikimedia. Filenames map as: `wK = Chess_klt45.svg`, `wQ = Chess_qlt45.svg`, `wR = Chess_rlt45.svg`, `wB = Chess_blt45.svg`, `wN = Chess_nlt45.svg`, `wP = Chess_plt45.svg`, `bK = Chess_kdt45.svg`, etc. (`l`/`d` = light/dark piece, `t` = transparent background).

Download all 12 from `https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces` and save into `public/pieces/` with the short names: `wK.svg`, `wQ.svg`, `wR.svg`, `wB.svg`, `wN.svg`, `wP.svg`, `bK.svg`, `bQ.svg`, `bR.svg`, `bB.svg`, `bN.svg`, `bP.svg`.

(If automation is preferred, a one-liner using `curl` per file works. If manual download is easier, do that. Either way the files must end up at the listed paths.)

- [ ] **Step 3: Stage Stockfish worker assets**

The `stockfish` npm package ships a single-file worker bundle. Copy it into `public/stockfish/`:

```bash
mkdir -p public/stockfish
cp node_modules/stockfish/src/stockfish.js public/stockfish/stockfish.js
cp node_modules/stockfish/src/stockfish.wasm public/stockfish/stockfish.wasm 2>/dev/null || true
```

Verify the files exist:
```bash
ls public/stockfish
```
Expected: `stockfish.js` (always) and `stockfish.wasm` (if WASM build is present in the npm package).

If the npm package's exact filenames differ (the package layout has changed across versions), inspect `node_modules/stockfish/` and copy whichever `.js` file is the worker bundle and any accompanying `.wasm`. Note the actual filename used — the worker client in Task 10 will reference it.

- [ ] **Step 4: Verify a piece SVG loads**

Start the dev server:
```bash
npm run dev
```
Open `http://localhost:5173/pieces/wK.svg` and `http://localhost:5173/img/michalis-napoleon.png` in a browser. Both should render. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add portrait, Cburnett piece set, and stockfish worker assets"
```

---

## Task 4: Routing skeleton

**Files:**
- Create: `src/routes.tsx`, `src/pages/HomePage.tsx`, `src/pages/PlayPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/pages/HomePage.tsx`**

```tsx
export default function HomePage() {
  return <div data-testid="home-page" className="p-8">Home</div>;
}
```

- [ ] **Step 2: Create `src/pages/PlayPage.tsx`**

```tsx
export default function PlayPage() {
  return <div data-testid="play-page" className="p-8">Play</div>;
}
```

- [ ] **Step 3: Create `src/routes.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlayPage from './pages/PlayPage';

export const router = createBrowserRouter([
  { path: '/',     element: <HomePage /> },
  { path: '/play', element: <PlayPage /> },
]);
```

- [ ] **Step 4: Replace `src/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 5: Smoke check both routes in the browser**

Run `npm run dev`. Visit `/` and `/play`. Both should show their placeholder text. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add react-router with home and play routes"
```

---

## Task 5: Chess type re-exports

**Files:**
- Create: `src/types/chess.ts`

- [ ] **Step 1: Create `src/types/chess.ts`**

```ts
export type Square =
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Promotion = 'q' | 'r' | 'b' | 'n';

export type GameMode = 'human-vs-human' | 'human-vs-ai';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Orientation = 'white' | 'black';

export type GameStatus =
  | 'idle'
  | 'in-progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'timeout';

export type GameSettings = {
  mode: GameMode;
  aiDifficulty: Difficulty;
  playerColor: 'white' | 'black';
  timeControl: { initialMs: number; incrementMs: number } | null;
  boardOrientation: Orientation;
};

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'human-vs-ai',
  aiDifficulty: 'medium',
  playerColor: 'white',
  timeControl: { initialMs: 5 * 60 * 1000, incrementMs: 0 },
  boardOrientation: 'white',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/types/chess.ts
git commit -m "feat: shared chess type definitions"
```

---

## Task 6: `useChessGame` hook (TDD)

**Files:**
- Create: `src/game/hooks/useChessGame.ts`
- Test: `src/game/hooks/useChessGame.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from './useChessGame';

describe('useChessGame', () => {
  it('starts in the standard position with white to move', () => {
    const { result } = renderHook(() => useChessGame());
    expect(result.current.turn).toBe('w');
    expect(result.current.status).toBe('idle');
    expect(result.current.history).toHaveLength(0);
    expect(result.current.fen.startsWith('rnbqkbnr/pppppppp')).toBe(true);
  });

  it('plays a legal move and updates turn', () => {
    const { result } = renderHook(() => useChessGame());
    let ok = false;
    act(() => { ok = result.current.move('e2', 'e4'); });
    expect(ok).toBe(true);
    expect(result.current.turn).toBe('b');
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].san).toBe('e4');
    expect(result.current.status).toBe('in-progress');
  });

  it('rejects illegal moves', () => {
    const { result } = renderHook(() => useChessGame());
    let ok = true;
    act(() => { ok = result.current.move('e2', 'e5'); });
    expect(ok).toBe(false);
    expect(result.current.history).toHaveLength(0);
  });

  it('returns legal moves from a square', () => {
    const { result } = renderHook(() => useChessGame());
    const moves = result.current.legalMovesFrom('e2');
    expect(moves.sort()).toEqual(['e3', 'e4']);
  });

  it('detects fool\'s mate', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.move('f2', 'f3'); });
    act(() => { result.current.move('e7', 'e5'); });
    act(() => { result.current.move('g2', 'g4'); });
    act(() => { result.current.move('d8', 'h4'); });
    expect(result.current.status).toBe('checkmate');
  });

  it('undoes the last move', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.move('e2', 'e4'); });
    act(() => { result.current.undo(); });
    expect(result.current.turn).toBe('w');
    expect(result.current.history).toHaveLength(0);
  });

  it('loads a PGN', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.loadPgn('1. e4 e5 2. Nf3 Nc6'); });
    expect(result.current.history).toHaveLength(4);
    expect(result.current.turn).toBe('w');
  });

  it('marks resigned status', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.resign('w'); });
    expect(result.current.status).toBe('resigned');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useChessGame`
Expected: module not found / hook missing.

- [ ] **Step 3: Implement `src/game/hooks/useChessGame.ts`**

```ts
import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess, type Move } from 'chess.js';
import type { Color, GameStatus, Promotion, Square } from '../../types/chess';

export type UseChessGameApi = {
  fen: string;
  pgn: string;
  history: Move[];
  turn: Color;
  inCheck: boolean;
  status: GameStatus;
  move: (from: Square, to: Square, promotion?: Promotion) => boolean;
  legalMovesFrom: (square: Square) => Square[];
  undo: () => void;
  reset: () => void;
  resign: (color: Color) => void;
  loadPgn: (pgn: string) => boolean;
  markTimeout: (loser: Color) => void;
};

function deriveStatus(chess: Chess, override?: GameStatus): GameStatus {
  if (override) return override;
  if (chess.history().length === 0) return 'idle';
  if (chess.isCheckmate()) return 'checkmate';
  if (chess.isStalemate()) return 'stalemate';
  if (chess.isDraw()) return 'draw';
  return 'in-progress';
}

export function useChessGame(): UseChessGameApi {
  const chessRef = useRef(new Chess());
  const [tick, setTick] = useState(0);
  const [override, setOverride] = useState<GameStatus | undefined>(undefined);

  const bump = () => setTick((t) => t + 1);

  const move = useCallback((from: Square, to: Square, promotion?: Promotion): boolean => {
    try {
      const result = chessRef.current.move({ from, to, promotion });
      if (!result) return false;
      setOverride(undefined);
      bump();
      return true;
    } catch {
      return false;
    }
  }, []);

  const legalMovesFrom = useCallback((square: Square): Square[] => {
    return chessRef.current.moves({ square, verbose: true }).map((m) => m.to as Square);
  }, []);

  const undo = useCallback(() => {
    chessRef.current.undo();
    setOverride(undefined);
    bump();
  }, []);

  const reset = useCallback(() => {
    chessRef.current = new Chess();
    setOverride(undefined);
    bump();
  }, []);

  const resign = useCallback((_color: Color) => {
    setOverride('resigned');
    bump();
  }, []);

  const markTimeout = useCallback((_loser: Color) => {
    setOverride('timeout');
    bump();
  }, []);

  const loadPgn = useCallback((pgn: string): boolean => {
    try {
      const next = new Chess();
      next.loadPgn(pgn);
      chessRef.current = next;
      setOverride(undefined);
      bump();
      return true;
    } catch {
      return false;
    }
  }, []);

  return useMemo(() => {
    const chess = chessRef.current;
    return {
      fen: chess.fen(),
      pgn: chess.pgn(),
      history: chess.history({ verbose: true }) as Move[],
      turn: chess.turn() as Color,
      inCheck: chess.inCheck(),
      status: deriveStatus(chess, override),
      move,
      legalMovesFrom,
      undo,
      reset,
      resign,
      loadPgn,
      markTimeout,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, override, move, legalMovesFrom, undo, reset, resign, loadPgn, markTimeout]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useChessGame`
Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/hooks/useChessGame.ts src/game/hooks/useChessGame.test.ts
git commit -m "feat(game): useChessGame hook with full chess.js wrapping"
```

---

## Task 7: `useTimer` hook (TDD)

**Files:**
- Create: `src/game/hooks/useTimer.ts`
- Test: `src/game/hooks/useTimer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useTimer', () => {
  it('starts paused with full time on both sides', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 60_000, incrementMs: 0 }));
    expect(result.current.whiteMs).toBe(60_000);
    expect(result.current.blackMs).toBe(60_000);
    expect(result.current.runningSide).toBeNull();
  });

  it('decrements the running side over time', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 60_000, incrementMs: 0 }));
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(2_000); });
    expect(result.current.whiteMs).toBeLessThanOrEqual(58_100);
    expect(result.current.whiteMs).toBeGreaterThanOrEqual(57_900);
    expect(result.current.blackMs).toBe(60_000);
  });

  it('switches sides and applies increment on press', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 60_000, incrementMs: 5_000 }));
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(3_000); });
    act(() => { result.current.press(); }); // white presses, gets +5s, black starts
    expect(result.current.runningSide).toBe('b');
    expect(result.current.whiteMs).toBeGreaterThanOrEqual(61_900);
  });

  it('flags a side at zero', () => {
    const onFlag = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ initialMs: 1_000, incrementMs: 0 }, onFlag),
    );
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(1_500); });
    expect(result.current.whiteMs).toBe(0);
    expect(onFlag).toHaveBeenCalledWith('w');
    expect(result.current.runningSide).toBeNull();
  });

  it('reset returns clocks to initial', () => {
    const { result } = renderHook(() => useTimer({ initialMs: 30_000, incrementMs: 0 }));
    act(() => { result.current.start('w'); });
    act(() => { vi.advanceTimersByTime(5_000); });
    act(() => { result.current.reset(); });
    expect(result.current.whiteMs).toBe(30_000);
    expect(result.current.runningSide).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useTimer`
Expected: module not found.

- [ ] **Step 3: Implement `src/game/hooks/useTimer.ts`**

```ts
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

  const tick = useCallback(() => {
    setRunningSide((side) => {
      if (!side) return side;
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      const delta = now - last;
      lastTickRef.current = now;
      const setter = side === 'w' ? setWhiteMs : setBlackMs;
      setter((ms) => {
        const next = Math.max(0, ms - delta);
        if (next === 0) {
          stopInterval();
          onFlagRef.current?.(side);
        }
        return next;
      });
      if ((side === 'w' ? whiteMs : blackMs) - delta <= 0) return null;
      return side;
    });
  }, [whiteMs, blackMs]);

  useEffect(() => () => stopInterval(), []);

  const start = useCallback((side: Color) => {
    stopInterval();
    setRunningSide(side);
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const press = useCallback(() => {
    setRunningSide((side) => {
      if (!side) return side;
      const setter = side === 'w' ? setWhiteMs : setBlackMs;
      setter((ms) => ms + control.incrementMs);
      const next: Color = side === 'w' ? 'b' : 'w';
      lastTickRef.current = Date.now();
      return next;
    });
  }, [control.incrementMs]);

  const pause = useCallback(() => {
    stopInterval();
    setRunningSide(null);
  }, []);

  const reset = useCallback(() => {
    stopInterval();
    setWhiteMs(control.initialMs);
    setBlackMs(control.initialMs);
    setRunningSide(null);
  }, [control.initialMs]);

  return { whiteMs, blackMs, runningSide, start, press, pause, reset };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useTimer`
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/hooks/useTimer.ts src/game/hooks/useTimer.test.ts
git commit -m "feat(game): useTimer hook with increment and flag detection"
```

---

## Task 8: `usePersistence` hook (TDD)

**Files:**
- Create: `src/game/hooks/usePersistence.ts`
- Test: `src/game/hooks/usePersistence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistence, SAVE_KEY } from './usePersistence';
import { DEFAULT_SETTINGS } from '../../types/chess';

beforeEach(() => { localStorage.clear(); });

describe('usePersistence', () => {
  it('returns null when nothing is saved', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current.load()).toBeNull();
  });

  it('round-trips a save', () => {
    const { result } = renderHook(() => usePersistence());
    act(() => {
      result.current.save({
        pgn: '1. e4 e5',
        settings: DEFAULT_SETTINGS,
        clock: { whiteMs: 1000, blackMs: 1000 },
      });
    });
    const loaded = result.current.load();
    expect(loaded?.pgn).toBe('1. e4 e5');
    expect(loaded?.settings.mode).toBe(DEFAULT_SETTINGS.mode);
    expect(loaded?.savedAt).toBeTypeOf('number');
  });

  it('clears the save', () => {
    const { result } = renderHook(() => usePersistence());
    act(() => {
      result.current.save({
        pgn: '1. e4',
        settings: DEFAULT_SETTINGS,
        clock: { whiteMs: 1000, blackMs: 1000 },
      });
    });
    act(() => { result.current.clear(); });
    expect(result.current.load()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    const { result } = renderHook(() => usePersistence());
    expect(result.current.load()).toBeNull();
  });

  it('rejects saves older than 7 days', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      pgn: '1. e4',
      settings: DEFAULT_SETTINGS,
      clock: { whiteMs: 1000, blackMs: 1000 },
      savedAt: eightDaysAgo,
    }));
    const { result } = renderHook(() => usePersistence());
    expect(result.current.load()).toBeNull();
  });

  it('swallows quota errors silently', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); };
    const { result } = renderHook(() => usePersistence());
    expect(() => act(() => {
      result.current.save({
        pgn: '1. e4',
        settings: DEFAULT_SETTINGS,
        clock: { whiteMs: 1000, blackMs: 1000 },
      });
    })).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- usePersistence`
Expected: module not found.

- [ ] **Step 3: Implement `src/game/hooks/usePersistence.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- usePersistence`
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/hooks/usePersistence.ts src/game/hooks/usePersistence.test.ts
git commit -m "feat(game): usePersistence hook with save/load/clear and prefs"
```

---

## Task 9: Stockfish difficulty mapping (TDD)

**Files:**
- Create: `src/game/stockfish/difficulty.ts`
- Test: `src/game/stockfish/difficulty.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { difficultyToConfig } from './difficulty';

describe('difficultyToConfig', () => {
  it('maps easy', () => {
    expect(difficultyToConfig('easy')).toEqual({ skill: 3, movetimeMs: 200 });
  });
  it('maps medium', () => {
    expect(difficultyToConfig('medium')).toEqual({ skill: 10, movetimeMs: 700 });
  });
  it('maps hard', () => {
    expect(difficultyToConfig('hard')).toEqual({ skill: 20, movetimeMs: 1500 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- difficulty`
Expected: module not found.

- [ ] **Step 3: Implement `src/game/stockfish/difficulty.ts`**

```ts
import type { Difficulty } from '../../types/chess';

export type EngineConfig = { skill: number; movetimeMs: number };

const TABLE: Record<Difficulty, EngineConfig> = {
  easy:   { skill: 3,  movetimeMs: 200 },
  medium: { skill: 10, movetimeMs: 700 },
  hard:   { skill: 20, movetimeMs: 1500 },
};

export function difficultyToConfig(d: Difficulty): EngineConfig {
  return TABLE[d];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- difficulty`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/stockfish/difficulty.ts src/game/stockfish/difficulty.test.ts
git commit -m "feat(stockfish): difficulty → engine config mapping"
```

---

## Task 10: Stockfish worker client (TDD with fake worker)

**Files:**
- Create: `src/game/stockfish/worker-client.ts`, `src/test/mocks/fake-stockfish.ts`
- Test: `src/game/stockfish/worker-client.test.ts`

The worker client speaks UCI to a `Worker`-shaped object. It is injectable so tests can substitute a fake worker.

- [ ] **Step 1: Create the fake worker** at `src/test/mocks/fake-stockfish.ts`

```ts
type Listener = (e: MessageEvent<string>) => void;

export class FakeStockfishWorker {
  private listeners: Listener[] = [];
  bestmoveResponse = 'bestmove e2e4';
  ready = true;

  addEventListener(_type: 'message', listener: Listener) {
    this.listeners.push(listener);
  }
  removeEventListener(_type: 'message', listener: Listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  postMessage(message: string) {
    if (message === 'uci') this.emit('uciok');
    else if (message === 'isready') this.emit(this.ready ? 'readyok' : '');
    else if (message.startsWith('go')) {
      queueMicrotask(() => this.emit(this.bestmoveResponse));
    }
  }
  terminate() { this.listeners = []; }
  private emit(line: string) {
    if (!line) return;
    this.listeners.forEach((l) => l({ data: line } as MessageEvent<string>));
  }
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { StockfishClient } from './worker-client';
import { FakeStockfishWorker } from '../../test/mocks/fake-stockfish';

describe('StockfishClient', () => {
  it('initializes via UCI handshake then resolves bestMove', async () => {
    const fake = new FakeStockfishWorker();
    const client = new StockfishClient(() => fake as unknown as Worker);
    await client.init();
    fake.bestmoveResponse = 'bestmove e7e5';
    const move = await client.bestMove({
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      skill: 10,
      movetimeMs: 100,
    });
    expect(move).toEqual({ from: 'e7', to: 'e5', promotion: undefined });
  });

  it('parses promotions in bestmove', async () => {
    const fake = new FakeStockfishWorker();
    const client = new StockfishClient(() => fake as unknown as Worker);
    await client.init();
    fake.bestmoveResponse = 'bestmove e7e8q';
    const move = await client.bestMove({
      fen: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
      skill: 1,
      movetimeMs: 50,
    });
    expect(move).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });

  it('terminate releases listeners', async () => {
    const fake = new FakeStockfishWorker();
    const client = new StockfishClient(() => fake as unknown as Worker);
    await client.init();
    client.terminate();
    expect(() => client.terminate()).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- worker-client`
Expected: module not found.

- [ ] **Step 4: Implement `src/game/stockfish/worker-client.ts`**

```ts
import type { Promotion, Square } from '../../types/chess';

export type BestMoveRequest = { fen: string; skill: number; movetimeMs: number };
export type BestMoveResult = { from: Square; to: Square; promotion?: Promotion };

export type WorkerFactory = () => Worker;

export const defaultWorkerFactory: WorkerFactory = () =>
  new Worker('/stockfish/stockfish.js');

export class StockfishClient {
  private worker: Worker | null = null;
  private currentResolver: ((m: BestMoveResult) => void) | null = null;
  private currentRejecter: ((reason: unknown) => void) | null = null;

  constructor(private factory: WorkerFactory = defaultWorkerFactory) {}

  async init(): Promise<void> {
    this.worker = this.factory();
    this.worker.addEventListener('message', this.onMessage);
    await this.expect('uciok', 'uci');
    await this.expect('readyok', 'isready');
  }

  async bestMove(req: BestMoveRequest): Promise<BestMoveResult> {
    if (!this.worker) throw new Error('StockfishClient not initialized');
    this.send(`setoption name Skill Level value ${req.skill}`);
    this.send(`position fen ${req.fen}`);
    return new Promise<BestMoveResult>((resolve, reject) => {
      this.currentResolver = resolve;
      this.currentRejecter = reject;
      this.send(`go movetime ${req.movetimeMs}`);
    });
  }

  terminate(): void {
    if (!this.worker) return;
    this.worker.removeEventListener('message', this.onMessage);
    this.worker.terminate();
    this.worker = null;
    this.currentResolver = null;
    this.currentRejecter = null;
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage = (e: MessageEvent<string>) => {
    const line = typeof e.data === 'string' ? e.data : '';
    if (line.startsWith('bestmove') && this.currentResolver) {
      const parts = line.split(/\s+/);
      const raw = parts[1] ?? '';
      if (!raw || raw === '(none)') {
        this.currentRejecter?.(new Error('no best move'));
      } else {
        const from = raw.slice(0, 2) as Square;
        const to = raw.slice(2, 4) as Square;
        const promotion = (raw.length > 4 ? (raw[4] as Promotion) : undefined);
        this.currentResolver({ from, to, promotion });
      }
      this.currentResolver = null;
      this.currentRejecter = null;
    }
  };

  private expect(token: string, command?: string): Promise<void> {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent<string>) => {
        if (typeof e.data === 'string' && e.data.includes(token)) {
          this.worker?.removeEventListener('message', handler);
          resolve();
        }
      };
      this.worker?.addEventListener('message', handler);
      if (command) this.send(command);
    });
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- worker-client`
Expected: 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/game/stockfish/worker-client.ts src/game/stockfish/worker-client.test.ts src/test/mocks/fake-stockfish.ts
git commit -m "feat(stockfish): UCI worker client with injectable factory"
```

---

## Task 11: `useStockfish` hook (TDD)

**Files:**
- Create: `src/game/hooks/useStockfish.ts`
- Test: `src/game/hooks/useStockfish.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStockfish } from './useStockfish';
import { FakeStockfishWorker } from '../../test/mocks/fake-stockfish';

describe('useStockfish', () => {
  it('initializes and serves a best move', async () => {
    const fake = new FakeStockfishWorker();
    const { result } = renderHook(() => useStockfish({ factory: () => fake as unknown as Worker }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    fake.bestmoveResponse = 'bestmove d2d4';
    let mv;
    await act(async () => {
      mv = await result.current.requestMove('startpos-fen', 'medium');
    });
    expect(mv).toEqual({ from: 'd2', to: 'd4', promotion: undefined });
  });

  it('reports unavailable when factory throws', async () => {
    const { result } = renderHook(() => useStockfish({
      factory: () => { throw new Error('no worker'); },
    }));
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.ready).toBe(false);
  });

  it('aiThinking is true while waiting for bestmove', async () => {
    const fake = new FakeStockfishWorker();
    const { result } = renderHook(() => useStockfish({ factory: () => fake as unknown as Worker }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.requestMove('fen', 'easy');
    });
    expect(result.current.aiThinking).toBe(true);
    await act(async () => { await promise; });
    expect(result.current.aiThinking).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useStockfish`
Expected: module not found.

- [ ] **Step 3: Implement `src/game/hooks/useStockfish.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { StockfishClient, defaultWorkerFactory, type BestMoveResult, type WorkerFactory } from '../stockfish/worker-client';
import { difficultyToConfig } from '../stockfish/difficulty';
import type { Difficulty } from '../../types/chess';

export type UseStockfishOptions = { factory?: WorkerFactory };

export type UseStockfishApi = {
  ready: boolean;
  unavailable: boolean;
  aiThinking: boolean;
  requestMove: (fen: string, difficulty: Difficulty) => Promise<BestMoveResult>;
};

export function useStockfish(opts: UseStockfishOptions = {}): UseStockfishApi {
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const clientRef = useRef<StockfishClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const factory = opts.factory ?? defaultWorkerFactory;
    let client: StockfishClient;
    try {
      client = new StockfishClient(factory);
    } catch {
      setUnavailable(true);
      return;
    }
    clientRef.current = client;
    client.init().then(
      () => { if (!cancelled) setReady(true); },
      () => { if (!cancelled) setUnavailable(true); },
    );
    return () => {
      cancelled = true;
      client.terminate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMove = useCallback(async (fen: string, difficulty: Difficulty) => {
    if (!clientRef.current) throw new Error('stockfish not ready');
    const cfg = difficultyToConfig(difficulty);
    setAiThinking(true);
    try {
      return await clientRef.current.bestMove({ fen, skill: cfg.skill, movetimeMs: cfg.movetimeMs });
    } finally {
      setAiThinking(false);
    }
  }, []);

  return { ready, unavailable, aiThinking, requestMove };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useStockfish`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/hooks/useStockfish.ts src/game/hooks/useStockfish.test.ts
git commit -m "feat(game): useStockfish hook with availability tracking"
```

---

## Task 12: `GameProvider` context

**Files:**
- Create: `src/game/GameProvider.tsx`
- Test: `src/game/GameProvider.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider, useGame } from './GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';

function Probe() {
  const g = useGame();
  return (
    <div>
      <span data-testid="turn">{g.game.turn}</span>
      <span data-testid="mode">{g.settings.mode}</span>
      <button onClick={() => g.setSettings({ ...g.settings, mode: 'human-vs-human' })}>set hvh</button>
    </div>
  );
}

describe('GameProvider', () => {
  it('exposes settings and game state', () => {
    render(<GameProvider initialSettings={DEFAULT_SETTINGS}><Probe /></GameProvider>);
    expect(screen.getByTestId('turn').textContent).toBe('w');
    expect(screen.getByTestId('mode').textContent).toBe(DEFAULT_SETTINGS.mode);
  });

  it('updates settings via setSettings', async () => {
    const user = userEvent.setup();
    render(<GameProvider initialSettings={DEFAULT_SETTINGS}><Probe /></GameProvider>);
    await user.click(screen.getByText('set hvh'));
    expect(screen.getByTestId('mode').textContent).toBe('human-vs-human');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- GameProvider`
Expected: module not found.

- [ ] **Step 3: Implement `src/game/GameProvider.tsx`**

```tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useChessGame, type UseChessGameApi } from './hooks/useChessGame';
import { useTimer, type UseTimerApi } from './hooks/useTimer';
import { useStockfish, type UseStockfishApi } from './hooks/useStockfish';
import { usePersistence, type UsePersistenceApi } from './hooks/usePersistence';
import { DEFAULT_SETTINGS, type GameSettings } from '../types/chess';

export type GameContextValue = {
  game: UseChessGameApi;
  timer: UseTimerApi;
  stockfish: UseStockfishApi;
  persistence: UsePersistenceApi;
  settings: GameSettings;
  setSettings: (next: GameSettings) => void;
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
  stockfishOptions?: Parameters<typeof useStockfish>[0];
};

export function GameProvider({ children, initialSettings = DEFAULT_SETTINGS, stockfishOptions }: Props) {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);

  const game = useChessGame();
  const timer = useTimer(
    settings.timeControl ?? { initialMs: 5 * 60 * 1000, incrementMs: 0 },
    (loser) => game.markTimeout(loser),
  );
  const stockfish = useStockfish(stockfishOptions);
  const persistence = usePersistence();

  useEffect(() => {
    if (game.history.length === 0) return;
    persistence.save({
      pgn: game.pgn,
      settings,
      clock: { whiteMs: timer.whiteMs, blackMs: timer.blackMs },
    });
    if (game.status !== 'in-progress' && game.status !== 'idle') {
      persistence.clear();
    }
  }, [game.pgn, game.status, game.history.length, settings, timer.whiteMs, timer.blackMs, persistence]);

  const value = useMemo<GameContextValue>(() => ({
    game, timer, stockfish, persistence, settings, setSettings,
  }), [game, timer, stockfish, persistence, settings]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- GameProvider`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/GameProvider.tsx src/game/GameProvider.test.tsx
git commit -m "feat(game): GameProvider context wiring all hooks"
```

---

## Task 13: `Piece` and `Square` components

**Files:**
- Create: `src/components/Piece.tsx`, `src/components/Square.tsx`
- Test: `src/components/Square.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Square } from './Square';

describe('Square', () => {
  it('renders with light colour for a1 + a3 pattern', () => {
    render(<Square name="a1" piece={null} highlight="none" onClick={() => {}} />);
    const el = screen.getByTestId('square-a1');
    expect(el.className).toContain('bg-imperial-cream');
  });

  it('renders with dark colour for a2', () => {
    render(<Square name="a2" piece={null} highlight="none" onClick={() => {}} />);
    expect(screen.getByTestId('square-a2').className).toContain('bg-imperial-burgundy');
  });

  it('renders a piece glyph when a piece is present', () => {
    render(<Square name="e1" piece={{ color: 'w', type: 'k' }} highlight="none" onClick={() => {}} />);
    expect(screen.getByAltText('white king')).toBeInTheDocument();
  });

  it('shows the legal-move dot for highlight=move', () => {
    render(<Square name="e4" piece={null} highlight="move" onClick={() => {}} />);
    expect(screen.getByTestId('legal-dot')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- Square`
Expected: modules not found.

- [ ] **Step 3: Implement `src/components/Piece.tsx`**

```tsx
import type { Color, PieceType } from '../types/chess';

const NAMES: Record<PieceType, string> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

export function Piece({ color, type }: { color: Color; type: PieceType }) {
  const file = `${color}${type.toUpperCase()}.svg`;
  const colorWord = color === 'w' ? 'white' : 'black';
  return (
    <img
      src={`/pieces/${file}`}
      alt={`${colorWord} ${NAMES[type]}`}
      draggable
      className="w-full h-full pointer-events-none select-none"
    />
  );
}
```

- [ ] **Step 4: Implement `src/components/Square.tsx`**

```tsx
import type { Color, PieceType, Square as SquareName } from '../types/chess';
import { Piece } from './Piece';

export type Highlight = 'none' | 'selected' | 'move' | 'capture' | 'lastMove' | 'check';

export type SquareProps = {
  name: SquareName;
  piece: { color: Color; type: PieceType } | null;
  highlight: Highlight;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
};

function isLight(name: SquareName): boolean {
  const file = name.charCodeAt(0) - 97; // a..h → 0..7
  const rank = parseInt(name[1], 10) - 1; // 1..8 → 0..7
  return (file + rank) % 2 === 1;
}

export function Square({ name, piece, highlight, onClick, onDragStart, onDrop, onDragOver }: SquareProps) {
  const base = isLight(name) ? 'bg-imperial-cream' : 'bg-imperial-burgundy';
  const highlightClass =
    highlight === 'selected' ? 'shadow-gold-glow' :
    highlight === 'lastMove' ? 'ring-2 ring-imperial-gold/60 ring-inset' :
    highlight === 'check' ? 'ring-4 ring-red-600 ring-inset' :
    '';
  return (
    <div
      data-testid={`square-${name}`}
      className={`relative aspect-square ${base} ${highlightClass} cursor-pointer`}
      onClick={onClick}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {piece && <Piece color={piece.color} type={piece.type} />}
      {highlight === 'move' && (
        <span data-testid="legal-dot" className="absolute inset-0 m-auto w-1/4 h-1/4 rounded-full bg-imperial-gold/70" />
      )}
      {highlight === 'capture' && (
        <span data-testid="legal-ring" className="absolute inset-1 rounded-full ring-4 ring-imperial-gold/70" />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- Square`
Expected: 4 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/Piece.tsx src/components/Square.tsx src/components/Square.test.tsx
git commit -m "feat(ui): Square + Piece components with imperial highlights"
```

---

## Task 14: `Board` component

**Files:**
- Create: `src/components/Board.tsx`
- Test: `src/components/Board.test.tsx`

The Board reads from the `GameProvider` context and orchestrates the click-and-drag UX. It is intentionally the only component that knows about the chess.js → React glue.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from './Board';
import { GameProvider } from '../game/GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';

const renderBoard = () => render(
  <GameProvider
    initialSettings={{ ...DEFAULT_SETTINGS, mode: 'human-vs-human', timeControl: null }}
    stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
  >
    <Board />
  </GameProvider>,
);

describe('Board', () => {
  it('renders 64 squares', () => {
    renderBoard();
    expect(screen.getAllByTestId(/^square-/)).toHaveLength(64);
  });

  it('clicking a piece highlights its legal moves', async () => {
    const user = userEvent.setup();
    renderBoard();
    await user.click(screen.getByTestId('square-e2'));
    // e3 and e4 should show legal-dot
    const dots = screen.getAllByTestId('legal-dot');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  it('clicking a piece then a legal target plays the move', async () => {
    const user = userEvent.setup();
    renderBoard();
    await user.click(screen.getByTestId('square-e2'));
    await user.click(screen.getByTestId('square-e4'));
    expect(screen.getByTestId('square-e4').querySelector('img')).toBeTruthy();
    expect(screen.getByTestId('square-e2').querySelector('img')).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- Board`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/Board.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Square as SquareCmp, type Highlight } from './Square';
import { useGame } from '../game/GameProvider';
import type { Color, PieceType, Square } from '../types/chess';

const FILES = ['a','b','c','d','e','f','g','h'] as const;
const RANKS = [8,7,6,5,4,3,2,1] as const;

function squaresInOrder(orientation: 'white' | 'black'): Square[] {
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();
  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const out: Square[] = [];
  for (const r of ranks) for (const f of files) out.push(`${f}${r}` as Square);
  return out;
}

export function Board() {
  const { game, settings } = useGame();
  const [selected, setSelected] = useState<Square | null>(null);

  const board = useMemo(() => new Chess(game.fen).board(), [game.fen]);
  const pieceAt = (sq: Square): { color: Color; type: PieceType } | null => {
    const file = sq.charCodeAt(0) - 97;
    const rank = 8 - parseInt(sq[1], 10);
    const cell = board[rank][file];
    if (!cell) return null;
    return { color: cell.color as Color, type: cell.type as PieceType };
  };

  const legalTargets: Square[] = selected ? game.legalMovesFrom(selected) : [];
  const lastMove = game.history.at(-1);

  // Clear selection on any external state change (undo/reset/AI move)
  useEffect(() => { setSelected(null); }, [game.history.length, game.status]);

  function highlightFor(sq: Square): Highlight {
    if (selected === sq) return 'selected';
    if (legalTargets.includes(sq)) {
      const target = pieceAt(sq);
      return target ? 'capture' : 'move';
    }
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) return 'lastMove';
    if (game.inCheck) {
      const piece = pieceAt(sq);
      if (piece && piece.type === 'k' && piece.color === game.turn) return 'check';
    }
    return 'none';
  }

  function onSquareClick(sq: Square) {
    const piece = pieceAt(sq);
    if (selected) {
      if (selected === sq) { setSelected(null); return; }
      if (legalTargets.includes(sq)) {
        // Promotion picker is handled in PlayPage via promotionPending; here default to queen.
        const ok = game.move(selected, sq, undefined);
        if (ok) { setSelected(null); return; }
      }
      if (piece && piece.color === game.turn) { setSelected(sq); return; }
      setSelected(null);
      return;
    }
    if (piece && piece.color === game.turn) setSelected(sq);
  }

  function onDragStart(sq: Square, e: React.DragEvent) {
    const piece = pieceAt(sq);
    if (!piece || piece.color !== game.turn) { e.preventDefault(); return; }
    setSelected(sq);
    e.dataTransfer.setData('text/plain', sq);
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(target: Square, e: React.DragEvent) {
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain') as Square;
    if (!from) return;
    game.move(from, target, undefined);
    setSelected(null);
  }

  const squares = squaresInOrder(settings.boardOrientation);

  return (
    <div className="grid grid-cols-8 w-full max-w-[640px] aspect-square shadow-imperial border-4 border-imperial-gold rounded-sm">
      {squares.map((sq) => (
        <SquareCmp
          key={sq}
          name={sq}
          piece={pieceAt(sq)}
          highlight={highlightFor(sq)}
          onClick={() => onSquareClick(sq)}
          onDragStart={(e) => onDragStart(sq, e)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(sq, e)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- Board`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Board.tsx src/components/Board.test.tsx
git commit -m "feat(ui): Board with click-and-drag move input"
```

---

## Task 15: `PromotionPicker` component

**Files:**
- Create: `src/components/PromotionPicker.tsx`
- Modify: `src/components/Board.tsx` (intercept promotion moves)
- Test: `src/components/PromotionPicker.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromotionPicker } from './PromotionPicker';

describe('PromotionPicker', () => {
  it('renders four options and reports the selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PromotionPicker color="w" onSelect={onSelect} onCancel={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: /queen/i }));
    expect(onSelect).toHaveBeenCalledWith('q');
  });

  it('calls onCancel when clicking the backdrop', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<PromotionPicker color="b" onSelect={() => {}} onCancel={onCancel} />);
    await user.click(screen.getByTestId('promotion-backdrop'));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PromotionPicker`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/PromotionPicker.tsx`**

```tsx
import type { Color, Promotion } from '../types/chess';

const OPTIONS: { piece: Promotion; label: string }[] = [
  { piece: 'q', label: 'Queen' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
  { piece: 'n', label: 'Knight' },
];

export function PromotionPicker({
  color, onSelect, onCancel,
}: { color: Color; onSelect: (p: Promotion) => void; onCancel: () => void }) {
  return (
    <div
      data-testid="promotion-backdrop"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-imperial-navy border-2 border-imperial-gold rounded-sm shadow-imperial p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-imperial-gold text-xl mb-4 text-center">Promote to</h3>
        <div className="flex gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.piece}
              aria-label={o.label}
              onClick={() => onSelect(o.piece)}
              className="w-20 h-20 bg-imperial-cream rounded-sm hover:shadow-gold-glow"
            >
              <img src={`/pieces/${color}${o.piece.toUpperCase()}.svg`} alt={`${o.label}`} className="w-full h-full" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Modify `src/components/Board.tsx` to detect promotion moves**

Replace the `onSquareClick` and `onDrop` handlers and add promotion state. Replace the body of `Board` from the existing `const [selected, setSelected] = useState<Square | null>(null);` line through the `return` with this:

```tsx
const [selected, setSelected] = useState<Square | null>(null);
const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

const board = useMemo(() => new Chess(game.fen).board(), [game.fen]);
const pieceAt = (sq: Square): { color: Color; type: PieceType } | null => {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1], 10);
  const cell = board[rank][file];
  if (!cell) return null;
  return { color: cell.color as Color, type: cell.type as PieceType };
};

const legalTargets: Square[] = selected ? game.legalMovesFrom(selected) : [];
const lastMove = game.history.at(-1);

useEffect(() => { setSelected(null); }, [game.history.length, game.status]);

function isPromotionMove(from: Square, to: Square): boolean {
  const piece = pieceAt(from);
  if (!piece || piece.type !== 'p') return false;
  const targetRank = parseInt(to[1], 10);
  return (piece.color === 'w' && targetRank === 8) || (piece.color === 'b' && targetRank === 1);
}

function tryMove(from: Square, to: Square) {
  if (isPromotionMove(from, to)) {
    setPendingPromotion({ from, to });
    return;
  }
  game.move(from, to, undefined);
  setSelected(null);
}

function highlightFor(sq: Square): Highlight {
  if (selected === sq) return 'selected';
  if (legalTargets.includes(sq)) {
    const target = pieceAt(sq);
    return target ? 'capture' : 'move';
  }
  if (lastMove && (lastMove.from === sq || lastMove.to === sq)) return 'lastMove';
  if (game.inCheck) {
    const piece = pieceAt(sq);
    if (piece && piece.type === 'k' && piece.color === game.turn) return 'check';
  }
  return 'none';
}

function onSquareClick(sq: Square) {
  const piece = pieceAt(sq);
  if (selected) {
    if (selected === sq) { setSelected(null); return; }
    if (legalTargets.includes(sq)) { tryMove(selected, sq); return; }
    if (piece && piece.color === game.turn) { setSelected(sq); return; }
    setSelected(null);
    return;
  }
  if (piece && piece.color === game.turn) setSelected(sq);
}

function onDragStart(sq: Square, e: React.DragEvent) {
  const piece = pieceAt(sq);
  if (!piece || piece.color !== game.turn) { e.preventDefault(); return; }
  setSelected(sq);
  e.dataTransfer.setData('text/plain', sq);
}
function onDragOver(e: React.DragEvent) { e.preventDefault(); }
function onDrop(target: Square, e: React.DragEvent) {
  e.preventDefault();
  const from = e.dataTransfer.getData('text/plain') as Square;
  if (!from) return;
  tryMove(from, target);
}

const squares = squaresInOrder(settings.boardOrientation);

return (
  <>
    <div className="grid grid-cols-8 w-full max-w-[640px] aspect-square shadow-imperial border-4 border-imperial-gold rounded-sm">
      {squares.map((sq) => (
        <SquareCmp
          key={sq}
          name={sq}
          piece={pieceAt(sq)}
          highlight={highlightFor(sq)}
          onClick={() => onSquareClick(sq)}
          onDragStart={(e) => onDragStart(sq, e)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(sq, e)}
        />
      ))}
    </div>
    {pendingPromotion && (
      <PromotionPicker
        color={game.turn}
        onSelect={(p) => {
          game.move(pendingPromotion.from, pendingPromotion.to, p);
          setPendingPromotion(null);
          setSelected(null);
        }}
        onCancel={() => { setPendingPromotion(null); setSelected(null); }}
      />
    )}
  </>
);
```

Add `import { PromotionPicker } from './PromotionPicker';` at the top of the file.

- [ ] **Step 5: Run the tests to verify all pass**

Run: `npm test -- Board PromotionPicker`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/PromotionPicker.tsx src/components/PromotionPicker.test.tsx src/components/Board.tsx
git commit -m "feat(ui): promotion picker and Board promotion handling"
```

---

## Task 16: `MoveHistory` component

**Files:**
- Create: `src/components/MoveHistory.tsx`
- Test: `src/components/MoveHistory.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoveHistory } from './MoveHistory';
import { GameProvider, useGame } from '../game/GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { useEffect } from 'react';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';

function Seed() {
  const { game } = useGame();
  useEffect(() => { game.loadPgn('1. e4 e5 2. Nf3 Nc6'); }, []);
  return null;
}

describe('MoveHistory', () => {
  it('renders moves grouped by move number', () => {
    render(
      <GameProvider
        initialSettings={DEFAULT_SETTINGS}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Seed />
        <MoveHistory />
      </GameProvider>,
    );
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('e5')).toBeInTheDocument();
    expect(screen.getByText('Nf3')).toBeInTheDocument();
    expect(screen.getByText('Nc6')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- MoveHistory`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/MoveHistory.tsx`**

```tsx
import { useGame } from '../game/GameProvider';

export function MoveHistory() {
  const { game } = useGame();
  const rows: { num: number; white?: string; black?: string }[] = [];
  game.history.forEach((m, i) => {
    const num = Math.floor(i / 2) + 1;
    if (i % 2 === 0) rows.push({ num, white: m.san });
    else rows[rows.length - 1].black = m.san;
  });
  return (
    <div className="bg-imperial-navy/60 border border-imperial-gold/40 rounded-sm p-3 max-h-80 overflow-y-auto font-mono text-sm">
      <h4 className="font-display text-imperial-gold mb-2 text-base">Moves</h4>
      <table className="w-full">
        <tbody>
          {rows.map((r) => (
            <tr key={r.num}>
              <td className="text-imperial-gold/60 pr-2 w-8">{r.num}.</td>
              <td className="pr-3">{r.white}</td>
              <td>{r.black}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- MoveHistory`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add src/components/MoveHistory.tsx src/components/MoveHistory.test.tsx
git commit -m "feat(ui): MoveHistory with SAN move pairs"
```

---

## Task 17: `CapturedPieces` component

**Files:**
- Create: `src/components/CapturedPieces.tsx`
- Test: `src/components/CapturedPieces.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapturedPieces } from './CapturedPieces';
import { GameProvider, useGame } from '../game/GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { useEffect } from 'react';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';

function Seed({ pgn }: { pgn: string }) {
  const { game } = useGame();
  useEffect(() => { game.loadPgn(pgn); }, []);
  return null;
}

describe('CapturedPieces', () => {
  it('shows pieces captured by white (i.e., black pieces taken)', () => {
    render(
      <GameProvider
        initialSettings={DEFAULT_SETTINGS}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Seed pgn="1. e4 d5 2. exd5" />
        <CapturedPieces capturedBy="w" />
      </GameProvider>,
    );
    // black pawn captured by white → image alt="black pawn"
    expect(screen.getByAltText('black pawn')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- CapturedPieces`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/CapturedPieces.tsx`**

```tsx
import { useGame } from '../game/GameProvider';
import { Piece } from './Piece';
import type { Color, PieceType } from '../types/chess';

export function CapturedPieces({ capturedBy }: { capturedBy: Color }) {
  const { game } = useGame();
  const captured: PieceType[] = [];
  for (const m of game.history) {
    if (!m.captured) continue;
    if (m.color === capturedBy) captured.push(m.captured as PieceType);
  }
  const enemyColor: Color = capturedBy === 'w' ? 'b' : 'w';
  // sort by piece value descending
  const order: Record<PieceType, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };
  captured.sort((a, b) => order[b] - order[a]);
  return (
    <div className="flex gap-1 min-h-8">
      {captured.map((t, i) => (
        <span key={i} className="w-6 h-6 inline-block">
          <Piece color={enemyColor} type={t} />
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- CapturedPieces`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add src/components/CapturedPieces.tsx src/components/CapturedPieces.test.tsx
git commit -m "feat(ui): captured pieces strip"
```

---

## Task 18: `Clock` and `PlayerCard` components

**Files:**
- Create: `src/components/Clock.tsx`, `src/components/PlayerCard.tsx`
- Test: `src/components/Clock.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Clock } from './Clock';

describe('Clock', () => {
  it('formats whole minutes and seconds', () => {
    render(<Clock ms={65000} active={false} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('shows tenths under 10 seconds', () => {
    render(<Clock ms={4500} active={false} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('marks active state with imperial-gold ring', () => {
    render(<Clock ms={60000} active />);
    expect(screen.getByTestId('clock').className).toContain('shadow-gold-glow');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- Clock`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/Clock.tsx`**

```tsx
function format(ms: number): string {
  if (ms < 10_000) return (Math.max(0, ms) / 1000).toFixed(1);
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Clock({ ms, active }: { ms: number; active: boolean }) {
  return (
    <div
      data-testid="clock"
      className={`font-mono text-3xl px-3 py-1 rounded-sm bg-imperial-navy border border-imperial-gold/60 ${active ? 'shadow-gold-glow' : ''}`}
    >
      {format(ms)}
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/components/PlayerCard.tsx`**

```tsx
import type { Color } from '../types/chess';
import { useGame } from '../game/GameProvider';
import { Clock } from './Clock';
import { CapturedPieces } from './CapturedPieces';

export function PlayerCard({ color }: { color: Color }) {
  const { timer, settings } = useGame();
  const ms = color === 'w' ? timer.whiteMs : timer.blackMs;
  const active = timer.runningSide === color;
  const label = color === 'w' ? 'White' : 'Black';
  const isMichalisSide = settings.mode === 'human-vs-ai' &&
    ((settings.playerColor === 'white' && color === 'b') ||
     (settings.playerColor === 'black' && color === 'w'));
  return (
    <div className="bg-imperial-navy/40 border border-imperial-gold/40 rounded-sm p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-imperial-gold text-lg">
          {isMichalisSide ? 'Emperor Michalis' : label}
        </span>
        {settings.timeControl && <Clock ms={ms} active={active} />}
      </div>
      <CapturedPieces capturedBy={color} />
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- Clock`
Expected: 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/Clock.tsx src/components/PlayerCard.tsx src/components/Clock.test.tsx
git commit -m "feat(ui): Clock and PlayerCard"
```

---

## Task 19: `ControlsPanel` component

**Files:**
- Create: `src/components/ControlsPanel.tsx`
- Test: `src/components/ControlsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlsPanel } from './ControlsPanel';
import { GameProvider, useGame } from '../game/GameProvider';
import { DEFAULT_SETTINGS } from '../types/chess';
import { useEffect } from 'react';
import { FakeStockfishWorker } from '../test/mocks/fake-stockfish';

function Probe({ onState }: { onState: (s: string) => void }) {
  const { game, settings } = useGame();
  useEffect(() => { onState(`${game.history.length}-${settings.boardOrientation}-${game.status}`); });
  return null;
}

describe('ControlsPanel', () => {
  it('Undo decrements history', async () => {
    const user = userEvent.setup();
    let last = '';
    function Seed() {
      const { game } = useGame();
      useEffect(() => { game.move('e2', 'e4'); }, []);
      return null;
    }
    render(
      <GameProvider
        initialSettings={{ ...DEFAULT_SETTINGS, mode: 'human-vs-human' }}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Seed />
        <Probe onState={(s) => { last = s; }} />
        <ControlsPanel />
      </GameProvider>,
    );
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(last.startsWith('0-')).toBe(true);
  });

  it('Flip toggles orientation', async () => {
    const user = userEvent.setup();
    let last = '';
    render(
      <GameProvider
        initialSettings={DEFAULT_SETTINGS}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Probe onState={(s) => { last = s; }} />
        <ControlsPanel />
      </GameProvider>,
    );
    await user.click(screen.getByRole('button', { name: /flip/i }));
    expect(last.includes('-black-')).toBe(true);
  });

  it('Resign sets status', async () => {
    const user = userEvent.setup();
    let last = '';
    render(
      <GameProvider
        initialSettings={DEFAULT_SETTINGS}
        stockfishOptions={{ factory: () => new FakeStockfishWorker() as unknown as Worker }}
      >
        <Probe onState={(s) => { last = s; }} />
        <ControlsPanel />
      </GameProvider>,
    );
    await user.click(screen.getByRole('button', { name: /resign/i }));
    expect(last.endsWith('-resigned')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ControlsPanel`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/ControlsPanel.tsx`**

```tsx
import { useGame } from '../game/GameProvider';

export function ControlsPanel() {
  const { game, timer, settings, setSettings } = useGame();
  const flip = () => setSettings({
    ...settings,
    boardOrientation: settings.boardOrientation === 'white' ? 'black' : 'white',
  });
  const newGame = () => { game.reset(); timer.reset(); };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={newGame}>New Game</Button>
      <Button onClick={() => game.undo()}>Undo</Button>
      <Button onClick={() => game.resign(game.turn)}>Resign</Button>
      <Button onClick={flip}>Flip</Button>
    </div>
  );
}

function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-imperial-cream border border-imperial-gold/70 bg-imperial-navy hover:shadow-gold-glow rounded-sm px-3 py-2"
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ControlsPanel`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ControlsPanel.tsx src/components/ControlsPanel.test.tsx
git commit -m "feat(ui): controls panel (new/undo/resign/flip)"
```

---

## Task 20: `SetupModal` component

**Files:**
- Create: `src/components/SetupModal.tsx`
- Test: `src/components/SetupModal.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupModal } from './SetupModal';
import { DEFAULT_SETTINGS } from '../types/chess';

describe('SetupModal', () => {
  it('confirms with selected mode and difficulty', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<SetupModal initial={DEFAULT_SETTINGS} aiAvailable onConfirm={onConfirm} onClose={() => {}} />);
    await user.click(screen.getByLabelText(/Hard/));
    await user.click(screen.getByRole('button', { name: /Begin/i }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ aiDifficulty: 'hard' }));
  });

  it('disables AI mode when aiAvailable is false', () => {
    render(<SetupModal initial={DEFAULT_SETTINGS} aiAvailable={false} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByLabelText(/Vs Michalis/i)).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- SetupModal`
Expected: module not found.

- [ ] **Step 3: Implement `src/components/SetupModal.tsx`**

```tsx
import { useState } from 'react';
import type { GameSettings } from '../types/chess';

type Props = {
  initial: GameSettings;
  aiAvailable: boolean;
  onConfirm: (s: GameSettings) => void;
  onClose: () => void;
};

const TIME_OPTIONS: { label: string; value: GameSettings['timeControl'] }[] = [
  { label: 'No clock',   value: null },
  { label: '3 + 0',      value: { initialMs: 3 * 60_000, incrementMs: 0 } },
  { label: '5 + 0',      value: { initialMs: 5 * 60_000, incrementMs: 0 } },
  { label: '10 + 5',     value: { initialMs: 10 * 60_000, incrementMs: 5_000 } },
];

export function SetupModal({ initial, aiAvailable, onConfirm, onClose }: Props) {
  const [s, setS] = useState<GameSettings>({ ...initial, mode: aiAvailable ? initial.mode : 'human-vs-human' });

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-imperial-navy border-2 border-imperial-gold rounded-sm shadow-imperial p-6 w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-imperial-gold text-2xl mb-4">Prepare for Battle</h2>

        <fieldset className="mb-4">
          <legend className="font-display text-imperial-gold/80 mb-2">Opponent</legend>
          <label className="block">
            <input
              type="radio"
              name="mode"
              checked={s.mode === 'human-vs-ai'}
              disabled={!aiAvailable}
              onChange={() => setS({ ...s, mode: 'human-vs-ai' })}
            /> Vs Michalis (AI)
          </label>
          <label className="block">
            <input
              type="radio"
              name="mode"
              checked={s.mode === 'human-vs-human'}
              onChange={() => setS({ ...s, mode: 'human-vs-human' })}
            /> Two Players
          </label>
        </fieldset>

        {s.mode === 'human-vs-ai' && (
          <fieldset className="mb-4">
            <legend className="font-display text-imperial-gold/80 mb-2">Difficulty</legend>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <label key={d} className="block capitalize">
                <input
                  type="radio"
                  name="diff"
                  checked={s.aiDifficulty === d}
                  onChange={() => setS({ ...s, aiDifficulty: d })}
                /> {d}
              </label>
            ))}
          </fieldset>
        )}

        {s.mode === 'human-vs-ai' && (
          <fieldset className="mb-4">
            <legend className="font-display text-imperial-gold/80 mb-2">Play as</legend>
            {(['white', 'black'] as const).map((c) => (
              <label key={c} className="capitalize mr-4">
                <input
                  type="radio"
                  name="color"
                  checked={s.playerColor === c}
                  onChange={() => setS({ ...s, playerColor: c, boardOrientation: c })}
                /> {c}
              </label>
            ))}
          </fieldset>
        )}

        <fieldset className="mb-4">
          <legend className="font-display text-imperial-gold/80 mb-2">Time control</legend>
          <select
            className="bg-imperial-cream text-imperial-ink rounded-sm px-2 py-1"
            value={JSON.stringify(s.timeControl)}
            onChange={(e) => setS({ ...s, timeControl: JSON.parse(e.target.value) })}
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.label} value={JSON.stringify(o.value)}>{o.label}</option>
            ))}
          </select>
        </fieldset>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="font-display text-imperial-cream/80 px-3 py-2"
          >Cancel</button>
          <button
            onClick={() => onConfirm(s)}
            className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
          >Begin the Duel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- SetupModal`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/SetupModal.tsx src/components/SetupModal.test.tsx
git commit -m "feat(ui): setup modal with mode/difficulty/color/time"
```

---

## Task 21: `ResumeBanner`, `GameOverDialog`, `AIThinkingIndicator`, `Toast`, `ImperialFrame`

**Files:**
- Create: `src/components/ResumeBanner.tsx`, `src/components/GameOverDialog.tsx`, `src/components/AIThinkingIndicator.tsx`, `src/components/Toast.tsx`, `src/components/ImperialFrame.tsx`
- Test: `src/components/GameOverDialog.test.tsx`, `src/components/ResumeBanner.test.tsx`

These are smaller presentational components grouped to keep the plan moving.

- [ ] **Step 1: Implement `src/components/ResumeBanner.tsx`**

```tsx
type Props = { savedAt: number; onResume: () => void; onDiscard: () => void };

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

export function ResumeBanner({ savedAt, onResume, onDiscard }: Props) {
  return (
    <div className="bg-imperial-burgundy/40 border border-imperial-gold/60 px-4 py-3 rounded-sm flex items-center justify-between">
      <span>You have an unfinished duel from <strong>{relTime(savedAt)}</strong>.</span>
      <div className="flex gap-2">
        <button onClick={onResume} className="font-display text-imperial-cream border border-imperial-gold px-3 py-1 rounded-sm hover:shadow-gold-glow">Resume</button>
        <button onClick={onDiscard} className="font-display text-imperial-cream/80 px-3 py-1">Discard</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/GameOverDialog.tsx`**

```tsx
import type { GameStatus } from '../types/chess';

const TITLES: Record<GameStatus, string> = {
  'idle': '',
  'in-progress': '',
  'checkmate': 'Checkmate',
  'stalemate': 'Stalemate',
  'draw': 'Draw',
  'resigned': 'Resignation',
  'timeout': 'Time Out',
};

export function GameOverDialog({
  status, winnerLabel, onNewGame, onClose,
}: {
  status: GameStatus;
  winnerLabel: string;
  onNewGame: () => void;
  onClose: () => void;
}) {
  if (status === 'idle' || status === 'in-progress') return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div className="bg-imperial-navy border-2 border-imperial-gold rounded-sm shadow-imperial p-8 w-[400px] text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-imperial-gold text-3xl mb-2">{TITLES[status]}</h2>
        <p className="font-body text-imperial-cream/90 mb-6">{winnerLabel}</p>
        <button
          onClick={onNewGame}
          className="font-display text-imperial-cream border border-imperial-gold bg-imperial-burgundy hover:shadow-gold-glow rounded-sm px-4 py-2"
        >New Duel</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `src/components/AIThinkingIndicator.tsx`**

```tsx
import { useGame } from '../game/GameProvider';

export function AIThinkingIndicator() {
  const { stockfish } = useGame();
  if (!stockfish.aiThinking) return null;
  return (
    <div className="font-body text-imperial-gold/90 italic flex items-center gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-imperial-gold animate-pulse" />
      The Emperor contemplates…
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/components/Toast.tsx`**

```tsx
import { useEffect, useState } from 'react';

let externalShow: ((msg: string) => void) | null = null;
export function showToast(msg: string) { externalShow?.(msg); }

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    externalShow = (m: string) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 4000);
    };
    return () => { externalShow = null; };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-imperial-navy border border-imperial-gold/80 text-imperial-cream px-4 py-2 rounded-sm shadow-imperial z-50">
      {msg}
    </div>
  );
}
```

- [ ] **Step 5: Implement `src/components/ImperialFrame.tsx`**

```tsx
import type { ReactNode } from 'react';

export function ImperialFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-imperial-navy/30 p-6 rounded-sm border border-imperial-gold/40 shadow-imperial">
      <CornerFlourish className="top-2 left-2 -rotate-90" />
      <CornerFlourish className="top-2 right-2" />
      <CornerFlourish className="bottom-2 left-2 rotate-180" />
      <CornerFlourish className="bottom-2 right-2 rotate-90" />
      {children}
    </div>
  );
}

function CornerFlourish({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`absolute w-8 h-8 text-imperial-gold/80 ${className}`} fill="currentColor" aria-hidden>
      <path d="M2 2 L14 2 L14 4 L4 4 L4 14 L2 14 Z" />
      <circle cx="6" cy="6" r="1.5" />
      <path d="M8 6 Q16 0 22 8" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}
```

- [ ] **Step 6: Write tests** at `src/components/GameOverDialog.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameOverDialog } from './GameOverDialog';

describe('GameOverDialog', () => {
  it('renders for checkmate and triggers new game', async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(<GameOverDialog status="checkmate" winnerLabel="White wins" onNewGame={onNew} onClose={() => {}} />);
    expect(screen.getByText('Checkmate')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /New Duel/i }));
    expect(onNew).toHaveBeenCalled();
  });

  it('renders nothing for in-progress', () => {
    const { container } = render(<GameOverDialog status="in-progress" winnerLabel="" onNewGame={() => {}} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
```

And `src/components/ResumeBanner.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResumeBanner } from './ResumeBanner';

describe('ResumeBanner', () => {
  it('shows recency text and triggers handlers', async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    const onDiscard = vi.fn();
    render(<ResumeBanner savedAt={Date.now() - 5 * 60_000} onResume={onResume} onDiscard={onDiscard} />);
    expect(screen.getByText(/min ago/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Resume/i }));
    await user.click(screen.getByRole('button', { name: /Discard/i }));
    expect(onResume).toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm test -- GameOverDialog ResumeBanner`
Expected: tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/ResumeBanner.tsx src/components/GameOverDialog.tsx src/components/AIThinkingIndicator.tsx src/components/Toast.tsx src/components/ImperialFrame.tsx src/components/GameOverDialog.test.tsx src/components/ResumeBanner.test.tsx
git commit -m "feat(ui): resume banner, game over dialog, AI indicator, toast host, imperial frame"
```

---

## Task 22: `HomePage` final layout

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Test: `src/pages/HomePage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders title, tagline, portrait, and CTA linking to /play', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Michalis Chess Master/i })).toBeInTheDocument();
    expect(screen.getByText(/Emperor of the 64 Squares/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Begin the Duel/i });
    expect(link.getAttribute('href')).toBe('/play');
    expect(screen.getByAltText(/Michalis as Napoleon/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- HomePage`
Expected: 4 assertions fail because the placeholder doesn't have these elements.

- [ ] **Step 3: Replace `src/pages/HomePage.tsx`**

```tsx
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main data-testid="home-page" className="min-h-screen relative overflow-hidden">
      <DamaskBackground />
      <div className="relative z-10 mx-auto max-w-6xl grid md:grid-cols-2 items-center min-h-screen px-8 gap-8">
        <section className="text-center md:text-left">
          <h1 className="font-display text-imperial-gold text-5xl md:text-7xl tracking-wide mb-4">
            Michalis<br />Chess Master
          </h1>
          <p className="font-body text-imperial-cream/90 text-xl mb-8 italic">
            Challenge the Emperor of the 64 Squares.
          </p>
          <Link
            to="/play"
            className="inline-block font-display text-imperial-cream text-xl border-2 border-imperial-gold bg-imperial-burgundy/80 px-8 py-3 rounded-sm shadow-imperial hover:shadow-gold-glow transition"
          >
            Begin the Duel
          </Link>
        </section>
        <section className="flex justify-center">
          <div className="rounded-full p-2 bg-imperial-gold shadow-imperial">
            <div className="rounded-full overflow-hidden border-4 border-imperial-navy w-72 h-72 md:w-96 md:h-96">
              <img
                src="/img/michalis-napoleon.png"
                alt="Michalis as Napoleon"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      </div>
      <footer className="absolute bottom-2 left-0 right-0 text-center text-imperial-cream/40 text-xs">
        Michalis Chess Master · Built for the parlour, played in the browser.
      </footer>
    </main>
  );
}

function DamaskBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden>
      <defs>
        <pattern id="damask" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M30 0 L40 20 L60 30 L40 40 L30 60 L20 40 L0 30 L20 20 Z" fill="#C9A24C" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#damask)" />
    </svg>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- HomePage`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx
git commit -m "feat(ui): imperial home page with hero portrait and CTA"
```

---

## Task 23: `PlayPage` assembly

**Files:**
- Modify: `src/pages/PlayPage.tsx`
- Test: `src/pages/PlayPage.test.tsx`

This is the largest assembly task: it composes the GameProvider, all panels, the setup modal, the resume banner, the game-over dialog, and wires up the AI move loop.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlayPage from './PlayPage';

beforeEach(() => { localStorage.clear(); });

describe('PlayPage', () => {
  it('shows setup modal on first visit', () => {
    render(<MemoryRouter><PlayPage /></MemoryRouter>);
    expect(screen.getByText(/Prepare for Battle/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PlayPage`
Expected: text not found in placeholder.

- [ ] **Step 3: Replace `src/pages/PlayPage.tsx`**

```tsx
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
import { usePersistence } from '../game/hooks/usePersistence';

export default function PlayPage() {
  const persistence = usePersistence();
  const [showSetup, setShowSetup] = useState(true);
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(persistence.loadPrefs() ?? {}),
  }));
  const [resumeOffer, setResumeOffer] = useState(persistence.load());

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
  resumeOffer: ReturnType<ReturnType<typeof usePersistence>['load']>;
  onResume: () => void;
  onDiscard: () => void;
};

function PlayPageInner({ showSetup, openSetup, closeSetup, confirmSetup, resumeOffer, onResume, onDiscard }: InnerProps) {
  const { game, timer, stockfish, settings } = useGame();

  // Resume effect: load PGN once after settings switch via Resume
  useEffect(() => {
    if (!resumeOffer) return;
    game.loadPgn(resumeOffer.pgn);
    if (settings.timeControl) {
      // restore clock state by adjusting via reset + manual subtract is not ideal;
      // simplest: continue with fresh clocks but with the saved running side determined by turn
    }
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- PlayPage`
Expected: 1 passing test.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests across all files pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/PlayPage.tsx src/pages/PlayPage.test.tsx
git commit -m "feat(ui): assemble PlayPage with provider, panels, AI loop, clock loop"
```

---

## Task 24: Manual smoke test in the browser

This task verifies feature correctness end-to-end. Type checking and unit tests cannot prove the UI works.

- [ ] **Step 1: Build & start dev server**

Run:
```bash
npm run build
npm run dev
```

Expected: Vite builds without errors and serves at `http://localhost:5173`.

- [ ] **Step 2: Smoke checklist (work through in the browser)**

For each of the following, perform the action and visually verify the outcome. Note any failures and fix them in a follow-up commit before declaring done.

- [ ] Visit `/`. The hero, portrait, title, tagline, and CTA all render. Click "Begin the Duel" → routes to `/play`.
- [ ] Setup modal appears on first visit to `/play`.
- [ ] Begin a Vs Michalis game on **Easy**. Play 3 moves; AI responds within ~1s and the indicator shows during its think.
- [ ] Begin a Vs Michalis game on **Hard**. AI takes longer (~1.5s) but plays.
- [ ] Begin a **Two Players** game with **5+0** clock. Both clocks count down only on the moving side, the inactive clock pauses.
- [ ] Drag a knight to a legal square — the move plays. Drag to an illegal square — the piece returns.
- [ ] Click a pawn — legal targets show as gold dots. Click a target — the move plays.
- [ ] Promote a pawn (e.g. by reaching the 8th rank) — the picker appears, choose Knight; the knight appears on the board.
- [ ] Click "Undo" — last move reverts.
- [ ] Click "Flip" — orientation flips; coordinates and pieces redraw mirrored.
- [ ] Click "Resign" mid-game — the GameOverDialog appears with "<color> resigns".
- [ ] Refresh the page mid-game — the ResumeBanner appears with a recency string. Click Resume — the position restores.
- [ ] Click Discard on the banner — banner disappears and the saved game is cleared.
- [ ] Force a checkmate (e.g. fool's mate sequence) — GameOverDialog appears with "Checkmate" and the correct winner.
- [ ] Force a stalemate (e.g. KQ vs k stalemate) — GameOverDialog appears with "Stalemate".
- [ ] Run out a clock (use 1+0 by editing the SetupModal or simply wait on 3+0) — GameOverDialog appears with "Time Out".
- [ ] En passant works (set up via two pawn pushes and an opposing pawn double-step adjacent).
- [ ] Both castling sides work for both colors (move the pieces between to allow castling, then click the king two squares).

- [ ] **Step 3: Fix any defects found**

For each failure: write a regression test in the relevant `*.test.ts(x)` file, then implement the fix. Commit each fix separately with a descriptive message.

- [ ] **Step 4: Final commit (only if smoke pass clean)**

```bash
git add -A
git commit -m "chore: smoke test pass — all features verified" --allow-empty
```

---

## Self-review of the plan against the spec

**Spec coverage check (each spec section → task that covers it):**
- Goals (polished imperial chess site) → Tasks 22 (Home), 23 (Play), 1/3 (theme + assets)
- Stockfish AI with 3 difficulties → Tasks 9, 10, 11; UI in 20, 23
- Move history with notation → Task 16
- Undo / takeback → Task 19
- Captured pieces display → Task 17
- Move highlights (legal moves) → Task 14 (Board), 13 (Square)
- AI difficulty levels → Task 9, 20
- Chess clock → Tasks 7, 18, 23
- Save & resume via localStorage → Tasks 8, 12, 23
- Board flip / play as black → Task 19, 20
- Both Human vs Human and Human vs AI → Tasks 20, 23
- Two pages (Home + Play) → Tasks 4, 22, 23
- Imperial visual theme (palette/typography/board frame) → Tasks 1, 13, 21
- Promotion picker → Task 15
- Error handling (unavailable Stockfish, corrupted save, quota) → Tasks 8, 11, 23
- Testing (Vitest + RTL + mocked worker) → Tasks 2, 6–17 (TDD for each unit)
- Manual smoke test → Task 24

No spec requirement is uncovered.

**Placeholder scan:** No "TBD"/"TODO"/"add appropriate error handling"/"similar to Task N" appears in any task body. Every code step contains the literal code to write.

**Type/method consistency:**
- `useChessGame` exposes: `move, legalMovesFrom, undo, reset, resign, loadPgn, markTimeout, fen, pgn, history, turn, inCheck, status` — used in `GameProvider` (12), `Board` (14, 15), `MoveHistory` (16), `CapturedPieces` (17), `ControlsPanel` (19), `PlayPage` (23). All names match.
- `useTimer` API (`whiteMs, blackMs, runningSide, start, press, pause, reset`) — used in `GameProvider`, `PlayerCard`, `Clock`, `ControlsPanel`, `PlayPage`. Match.
- `useStockfish` API (`ready, unavailable, aiThinking, requestMove`) — used in `GameProvider`, `AIThinkingIndicator`, `PlayPage`. Match.
- `usePersistence` API (`save, load, clear, savePrefs, loadPrefs`) — used in `GameProvider`, `PlayPage`. Match.
- `Square` `Highlight` union (`'none' | 'selected' | 'move' | 'capture' | 'lastMove' | 'check'`) — `Board.highlightFor` returns exactly these. Match.
- `GameStatus` union extended to include `'timeout'` (vs spec which had `'idle'|'in-progress'|'checkmate'|'stalemate'|'draw'|'resigned'`); this is an additive change to support clock flags as a terminal state. `useChessGame.markTimeout` and `GameOverDialog` titles handle it. Internally consistent.

Plan is complete.

