import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlayPage from './PlayPage';

beforeEach(() => {
  localStorage.clear();
  class StubWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    addEventListener() {}
    removeEventListener() {}
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal('Worker', StubWorker as unknown as typeof Worker);
});

describe('PlayPage', () => {
  it('shows setup modal on first visit', () => {
    render(<MemoryRouter><PlayPage /></MemoryRouter>);
    expect(screen.getByText(/Prepare for Battle/i)).toBeInTheDocument();
  });
});
