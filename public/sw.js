/* ─────────────────────────────────────────────────────────────
 * muscu.app — service worker
 *
 * Strategy
 *   • install  : precache the app shell (the main HTML routes)
 *   • activate : drop caches from older versions, claim clients
 *   • fetch
 *       – /api/*            : network-first, fall back to cache
 *       – static assets     : cache-first (CSS, JS, fonts, images)
 *       – HTML navigations  : network-first, fall back to cache,
 *                              then to the cached dashboard `/`
 *                              as a generic offline fallback
 *
 * Used in the gym where wifi is spotty, so the app must boot
 * and navigate between cached pages without a connection.
 * ───────────────────────────────────────────────────────────── */

const VERSION = "muscu-app-v6";
const STATIC_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// App shell — the routes the user lands on. Precache so the first
// paint after going offline still has something to show. Dynamic
// /seances/<id> URLs are NOT precached; they're cached on first
// visit and served from RUNTIME_CACHE.
const APP_SHELL = [
  "/",
  "/seances",
  "/seances/creer",
  "/seances/detail",
  "/seances/rapide",
  "/exercices",
  "/progression",
  "/settings",
  "/timer",
  "/calendrier",
  "/login",
  "/en",
  "/en/seances",
  "/en/seances/creer",
  "/en/seances/detail",
  "/en/seances/rapide",
  "/en/exercices",
  "/en/progression",
  "/en/settings",
  "/en/timer",
  "/timer/pop",
  "/en/timer/pop",
  "/en/calendrier",
  "/en/login",
  "/manifest.json",
  "/favicon.svg",
  "/input-stepper.css",
];

// Inline offline fallback. Kept tiny and dependency-free so it
// works even before any CSS is loaded.
const OFFLINE_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hors ligne — muscu.app</title>
    <style>
      :root { color-scheme: dark; }
      html, body { height: 100%; margin: 0; }
      body {
        background: #050505;
        color: #F6F6F6;
        font-family: 'Barlow', system-ui, sans-serif;
        display: grid;
        place-items: center;
        padding: 2.4rem;
      }
      .card {
        max-width: 36rem;
        text-align: center;
        background: #0B0B0B;
        border: 1px solid hsl(0 0% 100% / 0.08);
        border-radius: 14px;
        padding: 3.2rem 2.4rem;
      }
      h1 {
        font-family: 'Barlow Condensed', sans-serif;
        font-size: 2.4rem;
        margin: 0 0 1.2rem;
        color: hsl(32 55% 45%);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      p { color: #9CA3AF; margin: 0 0 2.0rem; line-height: 1.5; }
      a {
        display: inline-block;
        background: hsl(32 55% 45%);
        color: #fff;
        text-decoration: none;
        padding: 1.2rem 2.4rem;
        border-radius: 8px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      a:active { transform: scale(0.98); }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Hors ligne</h1>
      <p>Pas de connexion. Réessaie dès que le réseau revient, ou reviens au tableau de bord — tes données locales restent accessibles.</p>
      <a href="/">Retour au dashboard</a>
    </main>
  </body>
</html>`;

/* ── Install: precache the app shell ─────────────────────── */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Add each route independently so a single 404 doesn't
      // abort the whole precache.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {
            /* route not available yet — skip silently */
          })
        )
      );
    })()
  );
});

/* ── Activate: drop old caches, claim open clients ───────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* ── Fetch: route by request type ────────────────────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cross-origin (CDN, fonts, analytics…) — let the browser handle it.
  if (url.origin !== self.location.origin) return;

  // 1) API calls — network-first, cached fallback, hard 503 last.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 2) Static assets. Only Astro's prod bundles under /_astro/ carry
  //    content-hashed filenames → immutable → cache-first. Everything
  //    else (dev sources like /src/styles/*.css, public files) changes
  //    in place → network-first so edits and HMR actually show up
  //    instead of stale cached CSS/JS.
  if (isStaticAsset(request, url)) {
    event.respondWith(
      url.pathname.includes("/_astro/")
        ? cacheFirst(request)
        : networkFirst(request)
    );
    return;
  }

  // 3) HTML navigations — network-first, cached page, then /.
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  // 4) Everything else — network with cache fallback.
  event.respondWith(staleWhileRevalidate(request));
});

/* ── Helpers ─────────────────────────────────────────────── */

function isStaticAsset(request, url) {
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    return true;
  }
  return /\.(css|js|svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|otf)(\?.*)?$/i.test(
    url.pathname
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return cached ?? Response.error();
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function navigationHandler(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    // Cached version of the exact page?
    const cached = await caches.match(request);
    if (cached) return cached;
    // Otherwise fall back to the dashboard (always in APP_SHELL).
    const fallback = await caches.match("/");
    if (fallback) return fallback;
    // No shell cached yet — render the inline offline page.
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached ?? networkPromise;
}
