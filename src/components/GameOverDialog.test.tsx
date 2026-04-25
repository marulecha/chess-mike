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

  it('renders for disconnect', () => {
    render(<GameOverDialog status="disconnect" winnerLabel="Opponent forfeited" onNewGame={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Forfeit')).toBeInTheDocument();
  });

  it('clicking the backdrop calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameOverDialog status="checkmate" winnerLabel="White wins" onNewGame={() => {}} onClose={onClose} />);
    await user.click(screen.getByTestId('game-over-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('exposes a View Board button that calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameOverDialog status="checkmate" winnerLabel="White wins" onNewGame={() => {}} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /View Board/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('exposes a × close affordance in the corner', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameOverDialog status="checkmate" winnerLabel="White wins" onNewGame={() => {}} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /Close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
