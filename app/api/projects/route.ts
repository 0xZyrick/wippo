import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";
import { slugify } from "@/lib/slug";

function serializeLinks(links: unknown): { x?: string; website?: string; other?: string } | undefined {
  if (!links || typeof links !== "object") return undefined;
  const o = links as Record<string, unknown>;
  const out: { x?: string; website?: string; other?: string } = {};
  if (typeof o.x === "string" && o.x) out.x = o.x;
  if (typeof o.website === "string" && o.website) out.website = o.website;
  if (typeof o.other === "string" && o.other) out.other = o.other;
  return Object.keys(out).length ? out : undefined;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  if (!hasDatabase) {
    return NextResponse.json({ projects: memory.listProjectsForUser(user.id) });
  }

  const projects = await prisma.project.findMany({
    where: { creatorId: user.id },
    include: { _count: { select: { updates: true } }, creator: { select: { handle: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      intent: p.intent,
      handle: p.creator.handle,
      createdAt: p.createdAt.toISOString(),
      updateCount: p._count.updates,
      imageUrl: p.imageUrl ?? null,
      links: serializeLinks(p.links),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const intent = typeof body.intent === "string" ? body.intent.trim() : "";
  if (title.length < 2) {
    return NextResponse.json({ error: "Please add a project title." }, { status: 400 });
  }

  if (!hasDatabase) {
    const row = memory.createProject(user.id, title, intent);
    return NextResponse.json({
      project: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        intent: row.intent,
        handle: user.handle,
        createdAt: row.createdAt,
        updateCount: 0,
        imageUrl: null,
        links: undefined,
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      creatorId: user.id,
      title,
      slug: slugify(title),
      intent,
    },
  });
  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      intent: project.intent,
      handle: user.handle,
      createdAt: project.createdAt.toISOString(),
      updateCount: 0,
      imageUrl: null,
      links: undefined,
    },
  });
}
