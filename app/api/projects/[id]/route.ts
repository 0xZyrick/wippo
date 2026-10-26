import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";
import type { Prisma } from "@prisma/client";

function cleanLinks(raw: unknown): Prisma.InputJsonValue | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ["x", "website", "other"] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  return Object.keys(out).length ? out : null;
}

function serializeLinks(links: unknown): { x?: string; website?: string; other?: string } | undefined {
  if (!links || typeof links !== "object") return undefined;
  const o = links as Record<string, unknown>;
  const out: { x?: string; website?: string; other?: string } = {};
  if (typeof o.x === "string" && o.x) out.x = o.x;
  if (typeof o.website === "string" && o.website) out.website = o.website;
  if (typeof o.other === "string" && o.other) out.other = o.other;
  return Object.keys(out).length ? out : undefined;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!hasDatabase) {
    const found = memory.getProjectById(params.id);
    if (!found) {
      return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
    }
    return NextResponse.json({
      project: {
        ...found.project,
        handle: found.handle,
        links: found.project.links,
        imageUrl: found.project.imageUrl,
      },
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
  if (!project) {
    return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  }
  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      intent: project.intent,
      handle: project.creator.handle,
      createdAt: project.createdAt.toISOString(),
      imageUrl: project.imageUrl,
      links: serializeLinks(project.links),
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
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  let body: {
    title?: string;
    intent?: string;
    links?: { x?: string; website?: string; other?: string };
    imageUrl?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Something went wrong with that request. Please try again." },
      { status: 400 }
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const intent = typeof body.intent === "string" ? body.intent.trim() : undefined;
  const linksValue = body.links !== undefined ? cleanLinks(body.links) : undefined;
  const imageUrl =
    body.imageUrl === null
      ? null
      : typeof body.imageUrl === "string"
        ? body.imageUrl.trim() || null
        : undefined;

  if (title !== undefined && !title) {
    return NextResponse.json({ error: "Please add a project title." }, { status: 400 });
  }

  // Cap data-URL size so Postgres / payload doesn't silently fail
  if (imageUrl && imageUrl.startsWith("data:") && imageUrl.length > 900_000) {
    return NextResponse.json(
      {
        error:
          "Image is too large to store without file storage. Check AWS/Neon storage env vars on Vercel.",
      },
      { status: 400 }
    );
  }

  if (!hasDatabase) {
    const updated = memory.updateProject(params.id, user.id, {
      title,
      intent,
      links: linksValue && linksValue !== null && typeof linksValue === "object"
        ? (linksValue as { x?: string; website?: string; other?: string })
        : linksValue === null
          ? {}
          : undefined,
      imageUrl,
    });
    if (!updated) {
      return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
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
        imageUrl: updated.imageUrl,
      },
    });
  }

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing || existing.creatorId !== user.id) {
    return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  }

  try {
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(intent !== undefined ? { intent } : {}),
        ...(linksValue !== undefined ? { links: linksValue } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
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
        imageUrl: project.imageUrl,
        links: serializeLinks(project.links),
      },
    });
  } catch (e) {
    console.error("project PATCH failed", e);
    return NextResponse.json(
      {
        error:
          "Could not save project. If this is a new field (logo/links), run prisma db push on production.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  if (!hasDatabase) {
    const ok = memory.deleteProject(params.id, user.id);
    if (!ok) {
      return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing || existing.creatorId !== user.id) {
    return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
