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
