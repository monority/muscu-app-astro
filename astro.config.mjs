// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Static output: the app is 100% client-side (localStorage auth, no
  // middleware/cookies/params), so every route builds to a plain HTML file.
  // This is what Vercel can serve — the previous @astrojs/node standalone
  // adapter produced a Node entry point that Vercel cannot run, hence 404s.
  output: 'static',
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
  legacy: {
    // Dev-only: Vite 6.0.9+ rejects HMR WebSocket upgrades whose ?token= was
    // issued by a previous dev-server instance. After a server restart, pages
    // still open (or a cached preview webview) keep the old token and get
    // 400 → "TypeError: can't access property 'send', ws is undefined" in the
    // console, and HMR stays dead until a hard reload. The server binds
    // loopback-only, so skipping the token check is acceptable here; remove
    // this if the dev server is ever exposed beyond 127.0.0.1.
    skipWebSocketTokenCheck: true,
  },
  },
});