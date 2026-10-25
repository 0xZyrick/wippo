import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Managed Better Auth (server).
 * Lazy-init so `next build` can collect page data without env vars present
 * at compile time. Runtime still requires NEON_AUTH_BASE_URL + cookie secret.
 */
type NeonAuth = ReturnType<typeof createNeonAuth>;

const globalForAuth = globalThis as unknown as { __wippoNeonAuth?: NeonAuth };

function cookieSecret() {
  return (
    process.env.NEON_AUTH_COOKIE_SECRET ||
    process.env.SESSION_SECRET ||
    ""
  );
}

export function hasNeonAuth() {
  const secret = cookieSecret();
  return Boolean(process.env.NEON_AUTH_BASE_URL && secret.length >= 32);
}

function createAuth(): NeonAuth {
  const secret = cookieSecret();
  if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error(
      "Missing NEON_AUTH_BASE_URL. Set it in your environment (Vercel project env vars)."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "Missing cookie secret. Set NEON_AUTH_COOKIE_SECRET or SESSION_SECRET (32+ characters)."
    );
  }
  return createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    cookies: {
      secret,
      sameSite: "lax",
    },
    logLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
  });
}

function getAuth(): NeonAuth {
  if (!globalForAuth.__wippoNeonAuth) {
    globalForAuth.__wippoNeonAuth = createAuth();
  }
  return globalForAuth.__wippoNeonAuth;
}

/** Proxy so existing `auth.handler()` / `auth.getSession()` call sites keep working. */
export const auth = new Proxy({} as NeonAuth, {
  get(_target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
