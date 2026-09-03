/**
 * builderState — Pure helpers for toggle/expand state management.
 *
 * Reusable toggle pattern for any ID-based array state.
 */

// ── Toggle pattern ─────────────────────────────────────────────

export function toggleId(list: string[], id: string): string[] {
  if (list.includes(id)) {
    return list.filter((i) => i !== id);
  }
  return [...list, id];
}

export function addId(list: string[], id: string): string[] {
  if (list.includes(id)) return list;
  return [...list, id];
}

export function removeId(list: string[], id: string): string[] {
  return list.filter((i) => i !== id);
}

export function isIdIn(list: string[], id: string): boolean {
  return list.includes(id);
}

export function allExpanded(
  exerciseCount: number,
  expandedCount: number,
): boolean {
  return exerciseCount > 0 && expandedCount === exerciseCount;
}

// ── Dialog helpers ────────────────────────────────────────────

export function openDialogById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (window as any).openDialog as
    ((i: string) => void) | undefined;
  if (fn) fn(id);
}

export function closeDialogById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (window as any).closeDialog as
    ((i: string) => void) | undefined;
  if (fn) fn(id);
}
