import { hasDatabase, prisma } from "./db";
import { memory } from "./store";
import type { SessionUser } from "./types";
import { auth, hasNeonAuth } from "./auth/server";

/**
 * Resolve the signed-in app user.
 * Prefer Neon Managed Better Auth session, then map/upsert into Prisma User
 * so projects stay linked by our User.id / handle.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (hasNeonAuth()) {
    try {
      const { data: session } = await auth.getSession();
      const email = session?.user?.email?.trim().toLowerCase();
      if (!email) return null;

      if (!hasDatabase) {
        // Memory mode: ensure a memory user exists for this email
        const mem = memory.ensureUserByEmail(email, session?.user?.name || undefined);
        return mem;
      }

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const base =
          email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24) ||
          "builder";
        let handle = base;
        let n = 1;
        while (await prisma.user.findUnique({ where: { handle } })) {
          handle = `${base}${n++}`;
        }
        user = await prisma.user.create({
          data: {
            email,
            handle,
            displayName: session?.user?.name || handle,
          },
        });
      }

      return {
        id: user.id,
        handle: user.handle,
        email: user.email,
        displayName: user.displayName,
      };
    } catch {
      return null;
    }
  }

  // Legacy cookie session (dev / no Neon Auth)
  const { cookies } = await import("next/headers");
  const token = cookies().get("wippo_session")?.value;
  if (!token) return null;
  if (!hasDatabase) return memory.userFromSession(token);
  const user = await prisma.user.findUnique({ where: { id: token } });
  if (!user) return null;
  return {
    id: user.id,
    handle: user.handle,
    email: user.email,
    displayName: user.displayName,
  };
}

export function sessionCookieName() {
  return "wippo_session";
}
