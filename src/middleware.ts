import { defineMiddleware } from "astro/middleware";
import { createServerSupabase } from "./lib/supabase-server";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/logout"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerSupabase(context);
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  context.locals.user = user ?? null;

  const isPublic = PUBLIC_ROUTES.some((r) => context.url.pathname.startsWith(r));
  const isApi = context.url.pathname.startsWith("/api");

  if (!user && !isPublic && !isApi) {
    return context.redirect("/login");
  }

  return next();
});
