import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnlineSubForm } from './OnlineSubForm';
import { CODE_LEN } from '../game/online/code';

describe('OnlineSubForm', () => {
  it('host flow: clicking Host shows a generated code', async () => {
    const user = userEvent.setup();
    render(<OnlineSubForm onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Host a Party/i }));
    const codeEl = screen.getByTestId('host-code');
    const stripped = codeEl.textContent!.replace(/-/g, '');
    expect(stripped).toHaveLength(CODE_LEN);
  });

  it('host flow: Open Party fires onConfirm with role=host and chosen color', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<OnlineSubForm onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /Host a Party/i }));
    await user.click(screen.getByLabelText(/black/i));
    await user.click(screen.getByRole('button', { name: /Open Party/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'host',
        hostInit: expect.objectContaining({ color: 'black' }),
      }),
      expect.objectContaining({ boardOrientation: 'black' }),
    );
  });

  it('join flow: Connect is disabled until a valid code is entered', async () => {
    const user = userEvent.setup();
    render(<OnlineSubForm onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Join a Party/i }));
    const connect = screen.getByRole('button', { name: /Connect/i }) as HTMLButtonElement;
    expect(connect.disabled).toBe(true);
    await user.type(screen.getByLabelText(/party code/i), 'k7-mp3x');
    expect(connect.disabled).toBe(false);
  });

  it('join flow: Connect normalizes the code before firing onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<OnlineSubForm onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /Join a Party/i }));
    await user.type(screen.getByLabelText(/party code/i), 'k7-mp3x');
    await user.click(screen.getByRole('button', { name: /Connect/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      { role: 'join', code: 'K7MP3X' },
      {},
    );
  });
});
