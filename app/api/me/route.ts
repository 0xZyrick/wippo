import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { hasNeonAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim().slice(0, 64) : undefined;

  if (displayName === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  }

  if (hasNeonAuth()) {
    try {
      const { auth } = await import("@/lib/auth/server");
      await auth.updateUser({ name: displayName });
    } catch {
      // continue with app DB
    }
  }

  if (!hasDatabase) {
    return NextResponse.json({ user: { ...user, displayName } });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { displayName },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      handle: updated.handle,
      email: updated.email,
      displayName: updated.displayName,
    },
  });
}
