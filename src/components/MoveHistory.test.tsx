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
