/**
 * icons — Centralized Lucide-style icon registry.
 *
 * Every icon is a function that returns an inline SVG string.
 * Parent elements own the color; the SVG inherits via currentColor.
 *
 * Usage:
 *   <Fragment set:html={icons.dumbbell()} />
 *   <Fragment set:html={icons.trash(16)} />          // custom size
 *   <Fragment set:html={icons.check(18, 18)} />      // custom w×h
 */

const DEFAULT_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

function svg(body: string, w = 20, h = 20): string {
  return `<svg ${DEFAULT_ATTRS} width="${w}" height="${h}">${body}</svg>`;
}

function svgCustom(body: string, attrs: string): string {
  return `<svg ${attrs}>${body}</svg>`;
}

export const icons = {
  // ── Navigation / Layout ──────────────────────────────────────
  dashboard:   (w?: number, h?: number) => svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>', w, h),
  clipboard:   (w?: number, h?: number) => svg('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>', w, h),
  timer:       (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', w, h),
  calendar:    (w?: number, h?: number) => svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', w, h),
  dumbbell:    (w?: number, h?: number) => svg('<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>', w, h),
  trendingUp:  (w?: number, h?: number) => svg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>', w, h),
  calculator:  (w?: number, h?: number) => svg('<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/>', w, h),
  settings:    (w?: number, h?: number) => svg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', w, h),
  zap:         (w?: number, h?: number) => svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', w, h),

  // ── Arrows / Navigation ──────────────────────────────────────
  arrowLeft:       (w?: number, h?: number) => svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>', w, h),
  arrowDown:       (w?: number, h?: number) => svgCustom('<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  arrowUpDown:     (w?: number, h?: number) => svg('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>', w, h),
  chevronLeft:     (w?: number, h?: number) => svg('<polyline points="15 18 9 12 15 6"/>', w, h),
  chevronRight:    (w?: number, h?: number) => svg('<polyline points="9 18 15 12 9 6"/>', w, h),
  chevronDown:     (w?: number, h?: number) => svg('<polyline points="6 9 12 15 18 9"/>', w, h),
  chevronUp:       (w?: number, h?: number) => svgCustom('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),

  // ── Actions ──────────────────────────────────────────────────
  plus:        (w?: number, h?: number) => svgCustom('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  minus:       (w?: number, h?: number) => svgCustom('<line x1="5" y1="12" x2="19" y2="12"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  check:       (w?: number, h?: number) => svg('<polyline points="20 6 9 17 4 12"/>', w, h),
  checkCircle: (w?: number, h?: number) => svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', w, h),
  edit:        (w?: number, h?: number) => svgCustom('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  plusCircle:  (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>', w, h),
  trash:       (w?: number, h?: number) => svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', w, h),
  dots:        (w?: number, h?: number) => svg('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>', w, h),
  undo:        (w?: number, h?: number) => svg('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>', w, h),
  save:        (w?: number, h?: number) => svgCustom('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),

  // ── Media ─────────────────────────────────────────────────
  play:         (w?: number, h?: number) => svg('<polygon points="6 4 20 12 6 20 6 4"/>', w, h),

  // ── Star / Rating ──────────────────────────────────────────
  star:        (w?: number, h?: number) => svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', w, h),
  starFilled:  (w?: number, h?: number) => svgCustom('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),

  // ── Close / Dismiss ──────────────────────────────────────────
  closeX:      (w?: number, h?: number) => svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', w, h),
  closeCross:  (w?: number, h?: number) => svgCustom('<path d="M5 5L15 15M15 5L5 15"/>', 'viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"'),

  // ── Search ───────────────────────────────────────────────────
  search:      (w?: number, h?: number) => svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', w, h),
  searchX:     (w?: number, h?: number) => svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m8.5 8.5 5 5"/><path d="m13.5 8.5-5 5"/>', w, h),
  searchLine:  (w?: number, h?: number) => svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', w, h),

  // ── Content ──────────────────────────────────────────────────
  list:        (w?: number, h?: number) => svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', w, h),
  infoCircle:  (w?: number, h?: number) => svgCustom('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'),
  alertTriangle: (w?: number, h?: number) => svgCustom('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', 'viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),

  // ── Theme / UI ───────────────────────────────────────────────
  sun:         (w?: number, h?: number) => svgCustom('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),
  moon:        (w?: number, h?: number) => svgCustom('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),
  globe:       (w?: number, h?: number) => svgCustom('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),
  eye:         (w?: number, h?: number) => svgCustom('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  eyeOff:      (w?: number, h?: number) => svgCustom('<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  spinner:     (w?: number, h?: number) => svgCustom('<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'),

  // ── Timer / Clock ────────────────────────────────────────────
  clockStopwatch: (w?: number, h?: number) => svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>', w, h),
  stopwatch:   (w?: number, h?: number) => svg('<line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="10"/><circle cx="12" cy="14" r="8"/>', w, h),
  countdown:   (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', w, h),
  clock:       (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', w, h),
  bell:        (w?: number, h?: number) => svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', w, h),
  popout:      (w?: number, h?: number) => svg('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>', w, h),

  // ── Dumbbell variants ────────────────────────────────────────
  dumbbellBox:    (w?: number, h?: number) => svg('<path d="M6.5 6.5h11v11h-11z"/><path d="M2 9v6"/><path d="M22 9v6"/><path d="M6.5 6.5L2 9"/><path d="M17.5 6.5L22 9"/><path d="M6.5 17.5L2 15"/><path d="M17.5 17.5L22 15"/>', w, h),
  dumbbellSimple: (w?: number, h?: number) => svgCustom('<rect x="2" y="8" width="5" height="8" rx="0.5"/><rect x="17" y="8" width="5" height="8" rx="0.5"/><path d="M7 12h10"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  barbell:        (w?: number, h?: number) => svgCustom('<path d="M3 12h2M19 12h2"/><rect x="5" y="9" width="3" height="6" rx="0.5"/><rect x="16" y="9" width="3" height="6" rx="0.5"/><path d="M8 12h8"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),

  // ── Trend variants ───────────────────────────────────────────
  trendingUpLine: (w?: number, h?: number) => svg('<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/>', w, h),
  chartBar:       (w?: number, h?: number) => svgCustom('<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>', 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'),
  chart:          (w?: number, h?: number) => svg('<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>', w, h),
  scale:          (w?: number, h?: number) => svg('<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>', w, h),

  // ── Volume / Box ─────────────────────────────────────────────
  volumeBox:   (w?: number, h?: number) => svg('<path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9v6"/><path d="M21 9v6"/><path d="M6.5 6.5 3 9v6l3.5 2.5h11L21 15V9l-3.5-2.5Z"/>', w, h),

  // ── Stats / Achievement ────────────────────────────────────
  award:      (w?: number, h?: number) => svg('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>', w, h),
  flame:      (w?: number, h?: number) => svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', w, h),
  share:      (w?: number, h?: number) => svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>', w, h),
  link:       (w?: number, h?: number) => svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', w, h),
  printer:    (w?: number, h?: number) => svg('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>', w, h),
  smile:      (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>', w, h),
  heart:      (w?: number, h?: number) => svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', w, h),
  Meh:        (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>', w, h),
  frown:      (w?: number, h?: number) => svg('<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>', w, h),
  sad:        (w?: number, h?: number) => svg('<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>', w, h),
  grid:       (w?: number, h?: number) => svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/>', w, h),

  // ── User / Profile ───────────────────────────────────────────
  user:        (w?: number, h?: number) => svgCustom('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  target:      (w?: number, h?: number) => svgCustom('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  logout:      (w?: number, h?: number) => svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', w, h),

  // ── Settings / Data ──────────────────────────────────────────
  ruler:       (w?: number, h?: number) => svgCustom('<path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 12h18"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  database:    (w?: number, h?: number) => svgCustom('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  download:    (w?: number, h?: number) => svgCustom('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  upload:      (w?: number, h?: number) => svgCustom('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  table:       (w?: number, h?: number) => svgCustom('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),
  cloud:       (w?: number, h?: number) => svgCustom('<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><polyline points="8 16 12 20 16 16"/>', 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'),

  // ── Checkbox (16x16) ────────────────────────────────────────
  checkbox:    (w?: number, h?: number) => svgCustom('<path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', 'viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"'),
} as const;

export type IconName = keyof typeof icons;
