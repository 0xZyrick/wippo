import { NextRequest, NextResponse } from "next/server";
import { auth, hasNeonAuth } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  if (hasNeonAuth()) {
    try {
      await auth.signOut();
    } catch {
      // ignore
    }
  }
  const res = NextResponse.redirect(new URL("/", req.url));
  // Clear legacy cookie if present
  res.cookies.set("wippo_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
