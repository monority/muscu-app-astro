import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installTimerKeyboard, type TimerActions } from '../timer-input';

function mockActions(): TimerActions {
  return { toggle: vi.fn(), resetCurrent: vi.fn() };
}

function createWindow() {
  const listeners: Record<string, Function[]> = {};
  const win = {
    addEventListener: vi.fn((type: string, fn: Function) => {
      (listeners[type] ??= []).push(fn);
    }),
    removeEventListener: vi.fn((type: string, fn: Function) => {
      const arr = listeners[type];
      if (arr) {
        const i = arr.indexOf(fn);
        if (i >= 0) arr.splice(i, 1);
      }
    }),
    dispatch(type: string, e: any) {
      const evt = { preventDefault: vi.fn(), ...e };
      for (const fn of listeners[type] ?? []) fn(evt);
    },
  };
  return win;
}

describe('installTimerKeyboard', () => {
  let cleanup: () => void;
  let fakeWindow: ReturnType<typeof createWindow>;

  beforeEach(() => {
    fakeWindow = createWindow();
  });

  afterEach(() => {
    cleanup?.();
  });

  it('Space calls toggle', () => {
    const actions = mockActions();
    cleanup = installTimerKeyboard(actions, fakeWindow as any);
    fakeWindow.dispatch('keydown', { key: ' ' });
    expect(actions.toggle).toHaveBeenCalledTimes(1);
    expect(actions.resetCurrent).not.toHaveBeenCalled();
  });

  it('r calls resetCurrent', () => {
    const actions = mockActions();
    cleanup = installTimerKeyboard(actions, fakeWindow as any);
    fakeWindow.dispatch('keydown', { key: 'r' });
    expect(actions.resetCurrent).toHaveBeenCalledTimes(1);
  });

  it('R (uppercase) also works', () => {
    const actions = mockActions();
    cleanup = installTimerKeyboard(actions, fakeWindow as any);
    fakeWindow.dispatch('keydown', { key: 'R' });
    expect(actions.resetCurrent).toHaveBeenCalledTimes(1);
  });

  it('ignores modified keys (Ctrl+Space)', () => {
    const actions = mockActions();
    cleanup = installTimerKeyboard(actions, fakeWindow as any);
    fakeWindow.dispatch('keydown', { key: ' ', ctrlKey: true });
    expect(actions.toggle).not.toHaveBeenCalled();
  });

  it('cleanup removes listener', () => {
    const actions = mockActions();
    cleanup = installTimerKeyboard(actions, fakeWindow as any);
    cleanup();
    fakeWindow.dispatch('keydown', { key: ' ' });
    expect(actions.toggle).not.toHaveBeenCalled();
  });
});
