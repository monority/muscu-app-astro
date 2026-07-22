import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { APIContext } from "astro";
import type { AstroCookieSetOptions } from "astro/dist/core/cookies/index.js";

function toAstroCookieOptions(opts: CookieOptions): AstroCookieSetOptions {
  return {
    domain: opts.domain,
    path: opts.path ?? "/",
    sameSite: (opts.sameSite as "lax" | "strict" | "none") ?? "lax",
    secure: opts.secure ?? true,
    httpOnly: opts.httpOnly ?? true,
    maxAge: opts.maxAge,
    expires: opts.expires ? new Date(opts.expires) : undefined,
  };
}

export function createServerSupabase(context: APIContext) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return context.cookies.get(key)?.value ?? null;
        },
        set(key: string, value: string, options: CookieOptions) {
          context.cookies.set(key, value, toAstroCookieOptions(options));
        },
        remove(key: string, options: CookieOptions) {
          context.cookies.delete(key, toAstroCookieOptions(options));
        },
      },
    },
  );
}
