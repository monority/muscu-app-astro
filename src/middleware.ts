import { defineMiddleware } from "astro/middleware";
import { createServerSupabase } from "./lib/supabase-server";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/logout"];

export const onRequest = defineMiddleware(async (context, next) => {
  let user = null;

  if (import.meta.env.DEV) {
    const devUser = context.cookies.get("dev_user")?.value;
    if (devUser) {
      try {
        user = JSON.parse(devUser);
      } catch {}
    }
  }

  if (!user) {
    const supabase = createServerSupabase(context);
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  }

  context.locals.user = user;

  const isPublic = PUBLIC_ROUTES.some((r) => context.url.pathname.startsWith(r));
  const isApi = context.url.pathname.startsWith("/api");

  if (!user && !isPublic) {
    if (isApi) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect("/login");
  }

  return next();
});
