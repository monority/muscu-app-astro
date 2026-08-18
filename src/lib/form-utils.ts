/**
 * form-utils — Shared form field helpers.
 *
 * Eliminates the duplicated describedBy computation and
 * label/hint/error boilerplate between Input and Select.
 */

/** Build the aria-describedby value from a field id + hint/error state. */
export function buildDescribedBy(
  id: string | undefined,
  hint?: string,
  error?: string,
): string | undefined {
  if (!id) return undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return [hintId, errorId].filter(Boolean).join(" ") || undefined;
}
