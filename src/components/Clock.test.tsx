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
