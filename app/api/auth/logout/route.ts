import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";
import { hasDatabase } from "@/lib/db";
import { memory } from "@/lib/store";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (token && !hasDatabase) memory.clearSession(token);
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(sessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
