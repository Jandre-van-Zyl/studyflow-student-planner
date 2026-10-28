import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('opens Class activities from navigation and returns to the assessments workspace', () => {
    renderAt('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: 'Class activities' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Class activities' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Class activities' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByText(/file uploads and quiz submissions are not available yet/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('link', { name: 'Open assessments' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Assessments' })).toBeVisible();
  });
  it('shows a newly saved subject when it was added from Archived', async () => {
    renderAt('/subjects');
    fireEvent.click(screen.getByRole('button', { name: 'Archived (0)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
    fireEvent.change(screen.getByLabelText('Subject name'), {
      target: { value: 'Visible subject' },
    });
    fireEvent.change(screen.getByLabelText('Subject code'), { target: { value: 'VIS' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    expect(await screen.findByText('Visible subject')).toBeVisible();
  });
  it('retains the remaining-effort draft when completion is toggled twice', () => {
    renderAt('/assessments');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit Requirements draft' })[0]!);
    fireEvent.change(screen.getByLabelText('Remaining effort (minutes)'), {
      target: { value: '120' },
    });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Completed' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'In Progress' } });
    expect(screen.getByLabelText('Remaining effort (minutes)')).toHaveValue(120);
  });
  it('offers a usable restore action when all subjects are archived', async () => {
    renderAt('/subjects');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive SE2' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Archive PROG' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Archive PROG' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Archive PROG' })).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByRole('link', { name: 'Restore a subject' })).toHaveAttribute(
      'href',
      '/subjects',
    );
  });
  it('opens the dashboard without Firebase configuration', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'This week' })).toBeInTheDocument();
    expect(screen.getByText(/Changes reset on refresh/)).toBeInTheDocument();
  });

  it('navigates to an honestly labelled feature workspace', () => {
    renderAt('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: 'Assessments' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Assessments' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add assessment' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Assessments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('handles an unknown deep link and offers a working route back', () => {
    renderAt('/unknown');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Return to dashboard' }));
    expect(screen.getByRole('heading', { name: 'This week' })).toBeInTheDocument();
  });

  it('loads an explicit example week and filters assessments without pretending to save them', () => {
    renderAt('/dashboard');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    expect(screen.getByText('Requirements draft')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Assessments' }));
    fireEvent.change(screen.getByLabelText('Search assessments'), { target: { value: 'quiz' } });
    expect(screen.getAllByText('Revision quiz').length).toBeGreaterThan(0);
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByText('Requirements draft').length).toBeGreaterThan(0);
  });

  it('creates a subject through a labelled form, then permits an assessment', async () => {
    renderAt('/subjects');
    fireEvent.click(screen.getByRole('button', { name: 'Add subject' }));
    fireEvent.change(screen.getByLabelText('Subject name'), {
      target: { value: 'Software Engineering 2' },
    });
    fireEvent.change(screen.getByLabelText('Subject code'), { target: { value: 'SE2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save subject' }));
    expect(await screen.findByText('Software Engineering 2')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('link', { name: 'Assessments' }));
    expect(screen.getByRole('button', { name: 'Add assessment' })).toBeEnabled();
  });
  it('keeps the preview across account navigation', () => {
    renderAt('/dashboard');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getByRole('link', { name: 'Account' }));
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(screen.getByText('Requirements draft')).toBeInTheDocument();
  });
  it('requires explicit confirmation for overlapping study blocks and retains draft inputs', async () => {
    renderAt('/planner');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add study block' }));
    fireEvent.change(screen.getByLabelText('Study title'), { target: { value: 'Overlap draft' } });
    fireEvent.change(screen.getByLabelText('Start time (SAST)'), { target: { value: '09:30' } });
    fireEvent.change(screen.getByLabelText('End time (SAST)'), { target: { value: '10:15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save study block' }));
    expect(screen.getByRole('alert')).toHaveTextContent('This time overlaps');
    expect(screen.getByLabelText('Study title')).toHaveValue('Overlap draft');
    fireEvent.click(screen.getByRole('button', { name: 'Change time' }));
    expect(screen.getByLabelText('Start time (SAST)')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Save study block' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save with overlap' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByText('Overlap draft').length).toBeGreaterThan(0);
  });
  it('archives and restores assessments without deleting their history', async () => {
    renderAt('/assessments');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Archive Requirements draft' })[0]!);
    await waitFor(() => expect(screen.getByRole('button', { name: 'archived' })).toBeEnabled());
    expect(screen.queryByText('Requirements draft')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'archived' }));
    expect(screen.getAllByText('Requirements draft').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Restore Requirements draft' })[0]!);
    await waitFor(() => expect(screen.getByRole('button', { name: 'active' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'active' }));
    expect(screen.getAllByText('Requirements draft').length).toBeGreaterThan(0);
  });
  it('opens the linked assessment when planning time from the assessment list', () => {
    renderAt('/assessments');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getAllByRole('link', { name: 'Plan time' })[0]!);
    expect(screen.getByRole('dialog', { name: 'Add study block' })).toBeInTheDocument();
    expect(screen.getByLabelText('Linked assessment')).toHaveDisplayValue('Requirements draft');
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('warns about an over-budget block even when it overlaps nothing', async () => {
    renderAt('/planner');
    fireEvent.click(screen.getByRole('button', { name: 'Load example week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add study block' }));
    fireEvent.change(screen.getByLabelText('Study title'), { target: { value: 'Evening review' } });
    fireEvent.change(screen.getByLabelText('Start time (SAST)'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('End time (SAST)'), { target: { value: '18:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save study block' }));
    expect(screen.getByRole('alert')).toHaveTextContent('This day exceeds your study budget');
    expect(screen.getByRole('alert')).toHaveTextContent('60 minutes over');
    fireEvent.click(screen.getByRole('button', { name: 'Save over budget' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getAllByText('Evening review').length).toBeGreaterThan(0);
  });
});
