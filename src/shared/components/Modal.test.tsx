import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('modal keyboard and cleanup', () => {
  it('loops Shift+Tab and Tab inside the dialog and restores the trigger on unmount', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const view = render(
      <Modal title="Example" onClose={vi.fn()}>
        <button>Last action</button>
      </Modal>,
    );
    const first = screen.getByRole('button', { name: 'Close example' });
    const last = screen.getByRole('button', { name: 'Last action' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    view.unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
