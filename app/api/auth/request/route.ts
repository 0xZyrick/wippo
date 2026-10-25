import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (!hasDatabase) {
    const code = memory.requestOtp(email);
    return NextResponse.json({ ok: true, demoCode: code });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.otpChallenge.deleteMany({ where: { email } });
  await prisma.otpChallenge.create({
    data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  // Production: send email. Demo: return code when NODE_ENV development
  const payload: { ok: boolean; demoCode?: string } = { ok: true };
  if (process.env.NODE_ENV !== "production") payload.demoCode = code;
  return NextResponse.json(payload);
}
