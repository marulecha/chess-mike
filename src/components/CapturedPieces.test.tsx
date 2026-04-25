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
    expect(screen.getByAltText('black pawn')).toBeInTheDocument();
  });
});
