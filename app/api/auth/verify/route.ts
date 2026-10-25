import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";
import { sessionCookieName } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  if (!hasDatabase) {
    const user = memory.verifyOtp(email, code);
    if (!user) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    const token = memory.createSession(user.id);
    const res = NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle } });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: { email, code, expiresAt: { gt: new Date() } },
  });
  if (!challenge) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }
  await prisma.otpChallenge.deleteMany({ where: { email } });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const base =
      email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24) || "builder";
    let handle = base;
    let n = 1;
    while (await prisma.user.findUnique({ where: { handle } })) {
      handle = `${base}${n++}`;
    }
    user = await prisma.user.create({
      data: { email, handle, displayName: handle },
    });
  }

  const res = NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle } });
  res.cookies.set(sessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
