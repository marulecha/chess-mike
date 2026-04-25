import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders title, tagline, portrait, and CTA linking to /play', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Michalis Chess Master/i })).toBeInTheDocument();
    expect(screen.getByText(/Emperor of the 64 Squares/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Begin the Duel/i });
    expect(link.getAttribute('href')).toBe('/play');
    expect(screen.getByAltText(/Michalis as Napoleon/i)).toBeInTheDocument();
  });
});
