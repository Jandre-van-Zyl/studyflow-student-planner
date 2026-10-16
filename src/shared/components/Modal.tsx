import { useEffect, useId, useRef, type ReactNode } from 'react';

// Native modal dialogs supply inert background, Escape and focus containment.
export function Modal({
  title,
  children,
  onClose,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement;
    if (!node) return;
    if (node.showModal) node.showModal();
    else node.setAttribute('open', '');
    (
      node.querySelector<HTMLElement>('[data-initial-focus]') ??
      node.querySelector<HTMLElement>('input, select, button')
    )?.focus();
    return () => {
      if (node.close) node.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={heading}
      className={
        drawer
          ? 'drawer !m-0 !h-dvh !max-h-dvh !w-[min(320px,calc(100%-2rem))] !rounded-none'
          : 'dialog-enter'
      }
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 id={heading}>{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-quiet -mt-2 -mr-3"
          aria-label={`Close ${title.toLowerCase()}`}
        >
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
