import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudyTimer } from './StudyTimer';
import { useStudySessions } from './useStudySessions';
import { saveStudySession } from './studySessionService';
vi.mock('./useStudySessions');
vi.mock('./studySessionService');
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useStudySessions).mockReturnValue({ rows: [], ready: true, error: false });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function open() {
  render(<StudyTimer />);
  fireEvent.click(screen.getByRole('button', { name: /Study timer/ }));
}
describe('study timer', () => {
  it('does not transfer a running or paused free timer into a reminded study block', async () => {
    vi.useFakeTimers();
    render(
      <StudyTimer
        uid="owner"
        blocks={[
          {
            id: 'block-a',
            assessmentId: 'a',
            title: 'SE2',
            startAt: new Date(Date.now() - 60000).toISOString(),
            endAt: new Date(Date.now() + 14 * 60000).toISOString(),
            status: 'Planned',
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Study timer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole('button', { name: 'Open study timer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Open study timer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open study timer' }));
    expect(screen.getByRole('timer')).toHaveTextContent('15:00');
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save studied time' }));
    });
    expect(saveStudySession).toHaveBeenCalledWith(
      'owner',
      expect.any(String),
      'block-a',
      3,
      expect.any(Number),
      false,
    );
  });
  it('delivers a reminder when the tab becomes hidden and deduplicates only delivered notifications', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const delivered = vi.fn();
    class TestNotification {
      static permission = 'granted';
      onclick: (() => void) | null = null;
      constructor(title: string, options: NotificationOptions) {
        delivered(title, options);
      }
      close() {}
    }
    vi.stubGlobal('Notification', TestNotification);
    render(
      <StudyTimer
        blocks={[
          {
            id: 'block-a',
            assessmentId: 'a',
            title: 'SE2',
            startAt: new Date(Date.now() - 60000).toISOString(),
            endAt: new Date(Date.now() + 14 * 60000).toISOString(),
            status: 'Planned',
          },
        ]}
      />,
    );
    expect(delivered).not.toHaveBeenCalled();
    hidden.mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    expect(delivered).toHaveBeenCalledOnce();
    fireEvent(document, new Event('visibilitychange'));
    expect(delivered).toHaveBeenCalledOnce();
  });
  it('reminds for a planned block and records active time only after saving', async () => {
    vi.useFakeTimers();
    const begin = new Date(Date.now() - 60000).toISOString();
    const end = new Date(Date.now() + 14 * 60000).toISOString();
    vi.mocked(saveStudySession).mockResolvedValue(undefined);
    render(
      <StudyTimer
        uid="owner"
        blocks={[
          {
            id: 'block-a',
            assessmentId: 'a',
            title: 'Study SE2',
            startAt: begin,
            endAt: end,
            status: 'Planned',
          },
        ]}
      />,
    );
    expect(screen.getByText('Time to study: Study SE2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open study timer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(saveStudySession).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save studied time' }));
    });
    expect(saveStudySession).toHaveBeenCalledWith(
      'owner',
      expect.any(String),
      'block-a',
      10,
      expect.any(Number),
      false,
    );
  });
  it('uses document picture-in-picture when available and closes it on unmount', async () => {
    const childDocument = document.implementation.createHTMLDocument('Timer');
    const close = vi.fn();
    const requestWindow = vi.fn().mockResolvedValue({
      document: childDocument,
      close,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('documentPictureInPicture', { requestWindow });
    const view = render(<StudyTimer />);
    fireEvent.click(screen.getByRole('button', { name: /Study timer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Pop out' }));
    await waitFor(() =>
      expect(within(childDocument.body).getByText(/Always-on-top timer/).textContent).toContain(
        'Always-on-top timer',
      ),
    );
    expect(requestWindow).toHaveBeenCalledWith({ width: 360, height: 400 });
    view.unmount();
    expect(close).toHaveBeenCalledOnce();
  });
  it('starts, pauses and resets without creating study records', () => {
    vi.useFakeTimers();
    open();
    fireEvent.change(screen.getByLabelText('Session length (minutes)'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('00:50');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('00:50');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('timer')).toHaveTextContent('01:00');
  });
  it('uses elapsed wall time and stops at zero after a background gap', () => {
    vi.useFakeTimers();
    open();
    fireEvent.change(screen.getByLabelText('Session length (minutes)'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.setSystemTime(Date.now() + 120000);
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('00:00');
    expect(screen.getByRole('status')).toHaveTextContent('Session finished');
  });
  it('handles blocked pop-ups and retains the embedded timer', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Pop out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Allow pop-ups');
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
  });
  it('rejects invalid session lengths', () => {
    open();
    fireEvent.change(screen.getByLabelText('Session length (minutes)'), {
      target: { value: '181' },
    });
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  });
});
