/**
 * csv-export — Browser-side CSV download helpers.
 *
 * Pure DOM utilities for triggering file downloads.
 * No business logic — just blob creation + anchor click.
 */

/**
 * Trigger a browser download for a string content as a file.
 */
export function downloadBlob(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the download has time to start in Safari/Firefox.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lowercase slug for file names: accents stripped, non-alnum -> '-'. */
export function slugify(s: string): string {
  const slug = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'seance';
}
