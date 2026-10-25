import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Managed Better Auth (server).
 * Requires NEON_AUTH_BASE_URL + NEON_AUTH_COOKIE_SECRET (or SESSION_SECRET).
 */
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  process.env.SESSION_SECRET ||
  "";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "",
  cookies: {
    secret: cookieSecret,
    sameSite: "lax",
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
});

export function hasNeonAuth() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && cookieSecret.length >= 32);
}
