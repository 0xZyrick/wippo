import { cookies } from "next/headers";
import { hasDatabase, prisma } from "./db";
import { memory } from "./store";
import type { SessionUser } from "./types";

const COOKIE = "wippo_session";

export function sessionCookieName() {
  return COOKIE;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  if (!hasDatabase) return memory.userFromSession(token);
  // DB mode: token is userId for simplicity in this MVP
  const user = await prisma.user.findUnique({ where: { id: token } });
  if (!user) return null;
  return {
    id: user.id,
    handle: user.handle,
    email: user.email,
    displayName: user.displayName,
  };
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // Secure cookies on HTTPS (Vercel/production)
  secure: process.env.NODE_ENV === "production",
};

export function setSessionCookie(response: { cookies: { set: Function } }, token: string) {
  response.cookies.set(COOKIE, token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(response: { cookies: { set: Function } }) {
  response.cookies.set(COOKIE, "", { ...cookieBase, maxAge: 0 });
}
