import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

function normalizeMediaUrl(body: { mediaUrl?: unknown; mediaUrls?: unknown }) {
  if (Array.isArray(body.mediaUrls)) {
    const urls = body.mediaUrls
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim());
    if (!urls.length) return null;
    return urls.length === 1 ? urls[0] : JSON.stringify(urls);
  }
  if (typeof body.mediaUrl === "string") {
    return body.mediaUrl.trim() || null;
  }
  return undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; updateId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const headline =
    typeof body.headline === "string" ? body.headline.trim() : undefined;
  const why = typeof body.why === "string" ? body.why.trim() : undefined;
  const mediaUrl = normalizeMediaUrl(body);
  const mediaKind =
    typeof body.mediaKind === "string" ? body.mediaKind.trim() : undefined;

  if (why !== undefined && why.length < 3) {
    return NextResponse.json(
      { error: "Add a short note on why this matters." },
      { status: 400 }
    );
  }

  if (!hasDatabase) {
    return NextResponse.json(
      { error: "Editing updates requires the database." },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.creatorId !== user.id) {
    return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  }

  const existing = await prisma.projectUpdate.findFirst({
    where: { id: params.updateId, projectId: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "We could not find that update." }, { status: 404 });
  }

  const update = await prisma.projectUpdate.update({
    where: { id: params.updateId },
    data: {
      ...(headline !== undefined ? { headline: headline || "Update" } : {}),
      ...(why !== undefined ? { why } : {}),
      ...(mediaUrl !== undefined ? { mediaUrl } : {}),
      ...(mediaKind !== undefined ? { mediaKind } : {}),
    },
  });

  return NextResponse.json({
    update: {
      id: update.id,
      number: update.number,
      headline: update.headline,
      why: update.why,
      mediaUrl: update.mediaUrl,
      mediaKind: update.mediaKind,
      createdAt: update.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; updateId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  if (!hasDatabase) {
    return NextResponse.json(
      { error: "Deleting updates requires the database." },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.creatorId !== user.id) {
    return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  }

  const existing = await prisma.projectUpdate.findFirst({
    where: { id: params.updateId, projectId: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "We could not find that update." }, { status: 404 });
  }

  await prisma.projectUpdate.delete({ where: { id: params.updateId } });
  return NextResponse.json({ ok: true });
}
