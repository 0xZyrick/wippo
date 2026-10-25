import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!hasDatabase) {
    const found = memory.getProjectById(params.id);
    if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user && found.project.creatorId !== user.id) {
      // owner workspace only — public uses /api/public
    }
    return NextResponse.json({
      project: found.project,
      updates: memory.listUpdates(params.id),
    });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      updates: { orderBy: { number: "asc" } },
      creator: { select: { handle: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      intent: project.intent,
      handle: project.creator.handle,
      createdAt: project.createdAt.toISOString(),
    },
    updates: project.updates.map((u) => ({
      id: u.id,
      number: u.number,
      headline: u.headline,
      why: u.why,
      mediaUrl: u.mediaUrl,
      mediaKind: u.mediaKind,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    intent?: string;
    links?: { x?: string; website?: string; other?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : undefined;
  const intent =
    typeof body.intent === "string" ? body.intent.trim() : undefined;
  const links = body.links;

  if (title !== undefined && !title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  if (!hasDatabase) {
    const updated = memory.updateProject(params.id, user.id, {
      title,
      intent,
      links,
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      project: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        intent: updated.intent,
        handle: user.handle,
        createdAt: updated.createdAt,
        links: updated.links,
      },
    });
  }

  const existing = await prisma.project.findUnique({
    where: { id: params.id },
  });
  if (!existing || existing.creatorId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(intent !== undefined ? { intent } : {}),
    },
    include: { creator: { select: { handle: true } } },
  });

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      intent: project.intent,
      handle: project.creator.handle,
      createdAt: project.createdAt.toISOString(),
    },
  });
}
