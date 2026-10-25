import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight guard: dashboard requires a session cookie.
 * Full session validation happens in getSessionUser() (Neon Auth).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/workspace")) {
    // Neon Auth sets its own cookies; also accept legacy wippo_session
    const hasAny =
      req.cookies.getAll().some((c) =>
        /session|better-auth|wippo/i.test(c.name)
      );
    if (!hasAny) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspace/:path*"],
};
