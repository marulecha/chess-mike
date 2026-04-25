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
