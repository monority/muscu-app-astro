/**
 * Synchronous theme bootstrap — runs inline in <head> before first paint.
 * Reads localStorage, sets data-theme on <html>, optionally syncs
 * a <meta name="theme-color"> with a CSS custom property.
 *
 * Usage (inline):
 *   <script is:inline src="/theme-bootstrap.js" data-meta-var="--color-bg"></script>
 *
 * The data-meta-var attribute is optional. When present, the script reads
 * that CSS variable and pushes its value into the theme-color meta tag.
 */
(function () {
  try {
    var theme = localStorage.getItem('muscu-theme') || 'dark';
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    var script = document.currentScript;
    var metaVar = script && script.getAttribute('data-meta-var');
    if (metaVar) {
      var value = getComputedStyle(document.documentElement)
        .getPropertyValue(metaVar).trim();
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta && value) meta.setAttribute('content', value);
    }
  } catch (e) {
    /* localStorage unavailable (SSR / private mode) */
  }
})();
