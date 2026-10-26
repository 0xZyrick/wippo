import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

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
  { params }: { params: { handle: string; slug: string } }
) {
  const handle = params.handle.replace(/^@/, "");
  const slug = params.slug;

  if (!hasDatabase) {
    const found = memory.getProjectByHandleSlug(handle, slug);
    if (!found) return NextResponse.json({ error: "This project could not be found." }, { status: 404 });
    return NextResponse.json({
      project: {
        id: found.project.id,
        title: found.project.title,
        slug: found.project.slug,
        intent: found.project.intent,
        handle: found.handle,
        imageUrl: found.project.imageUrl,
        links: serializeLinks(found.project.links),
      },
      updates: memory.listUpdates(found.project.id),
    });
  }

  const user = await prisma.user.findFirst({
    where: { handle: { equals: handle, mode: "insensitive" } },
  });
  if (!user) return NextResponse.json({ error: "This project could not be found." }, { status: 404 });

  const project = await prisma.project.findFirst({
    where: { creatorId: user.id, slug },
    include: { updates: { orderBy: { number: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "This project could not be found." }, { status: 404 });

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      intent: project.intent,
      handle: user.handle,
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
