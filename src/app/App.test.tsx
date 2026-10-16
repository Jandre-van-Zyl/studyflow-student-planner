import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('shared starter navigation', () => {
  it('opens the dashboard without Firebase configuration', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /Make room for/ })).toBeInTheDocument();
    expect(screen.getByText('Foundation preview')).toBeInTheDocument();
  });

  it('navigates to an honestly labelled feature workspace', () => {
    renderAt('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: 'Assessments' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Assessments' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coming next' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Assessments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('handles an unknown deep link and offers a working route back', () => {
    renderAt('/unknown');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Return to dashboard' }));
    expect(screen.getByRole('heading', { name: /Make room for/ })).toBeInTheDocument();
  });
});
