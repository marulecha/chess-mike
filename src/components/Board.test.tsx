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
