/**
 * timer-input — Keyboard shortcut handler for the timer page.
 *
 * Space toggles play/pause, R resets. Ignores events inside form
 * elements and modifier keys. Returns a cleanup function.
 */

export interface TimerActions {
  toggle(): void;
  resetCurrent(): void;
}

/** Install keyboard shortcuts. Returns cleanup fn to remove listener. */
export function installTimerKeyboard(
  actions: TimerActions,
  win: { addEventListener: typeof window.addEventListener; removeEventListener: typeof window.removeEventListener } = typeof window !== 'undefined' ? window : ({} as any),
): () => void {
  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ') {
      e.preventDefault();
      actions.toggle();
    } else if (e.key.toLowerCase() === 'r') {
      actions.resetCurrent();
    }
  };
  win.addEventListener('keydown', handler);
  return () => win.removeEventListener('keydown', handler);
}
