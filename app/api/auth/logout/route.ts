import { NextRequest, NextResponse } from "next/server";
import { hasNeonAuth } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  if (hasNeonAuth()) {
    try {
      const { auth } = await import("@/lib/auth/server");
      await auth.signOut();
    } catch {
      // ignore
    }
  }
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("wippo_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
