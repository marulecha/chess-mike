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
