import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toggleId,
  addId,
  removeId,
  isIdIn,
  allExpanded,
  openDialogById,
  closeDialogById,
} from '../../components/builder/builderState';

describe('toggleId', () => {
  it('adds id when not present', () => {
    expect(toggleId(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('removes id when present', () => {
    expect(toggleId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('returns single item array when toggling empty list', () => {
    expect(toggleId([], 'x')).toEqual(['x']);
  });
});

describe('addId', () => {
  it('adds id when not present', () => {
    expect(addId(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('does not duplicate id', () => {
    expect(addId(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });
});

describe('removeId', () => {
  it('removes id', () => {
    expect(removeId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('returns same array when id not found', () => {
    expect(removeId(['a', 'b'], 'z')).toEqual(['a', 'b']);
  });
});

describe('isIdIn', () => {
  it('returns true when id present', () => {
    expect(isIdIn(['a', 'b'], 'b')).toBe(true);
  });

  it('returns false when id absent', () => {
    expect(isIdIn(['a', 'b'], 'z')).toBe(false);
  });
});

describe('allExpanded', () => {
  it('returns true when all expanded', () => {
    expect(allExpanded(3, 3)).toBe(true);
  });

  it('returns false when partially expanded', () => {
    expect(allExpanded(3, 2)).toBe(false);
  });

  it('returns false when no exercises', () => {
    expect(allExpanded(0, 0)).toBe(false);
  });
});

describe('openDialogById', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls window.openDialog with id', () => {
    const fn = vi.fn();
    vi.stubGlobal('window', { openDialog: fn });
    openDialogById('test-dialog');
    expect(fn).toHaveBeenCalledWith('test-dialog');
  });

  it('does not throw when openDialog missing', () => {
    vi.stubGlobal('window', {});
    expect(() => openDialogById('test')).not.toThrow();
  });
});

describe('closeDialogById', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls window.closeDialog with id', () => {
    const fn = vi.fn();
    vi.stubGlobal('window', { closeDialog: fn });
    closeDialogById('test-dialog');
    expect(fn).toHaveBeenCalledWith('test-dialog');
  });

  it('does not throw when closeDialog missing', () => {
    vi.stubGlobal('window', {});
    expect(() => closeDialogById('test')).not.toThrow();
  });
});
