import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { hasNeonAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

function slugHandle(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "builder";
  return base;
}

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
      // continue
    }
  }

  if (!hasDatabase) {
    const handle = slugHandle(displayName);
    return NextResponse.json({
      user: { ...user, displayName, handle },
    });
  }

  // Derive a unique handle from the display name
  let handle = slugHandle(displayName);
  let n = 1;
  while (true) {
    const taken = await prisma.user.findUnique({ where: { handle } });
    if (!taken || taken.id === user.id) break;
    handle = `${slugHandle(displayName)}${n++}`.slice(0, 30);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { displayName, handle },
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
