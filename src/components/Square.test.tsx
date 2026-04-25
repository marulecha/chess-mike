import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Square } from './Square';

describe('Square', () => {
  it('renders with dark colour for a1 (chess convention)', () => {
    render(<Square name="a1" piece={null} highlight="none" onClick={() => {}} />);
    expect(screen.getByTestId('square-a1').className).toContain('bg-imperial-burgundy');
  });

  it('renders with light colour for a2', () => {
    render(<Square name="a2" piece={null} highlight="none" onClick={() => {}} />);
    expect(screen.getByTestId('square-a2').className).toContain('bg-imperial-cream');
  });

  it('renders with light colour for h1 (chess convention - corner square)', () => {
    render(<Square name="h1" piece={null} highlight="none" onClick={() => {}} />);
    expect(screen.getByTestId('square-h1').className).toContain('bg-imperial-cream');
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
