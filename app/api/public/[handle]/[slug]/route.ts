import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { handle: string; slug: string } }
) {
  const handle = params.handle.replace(/^@/, "");
  const slug = params.slug;

  if (!hasDatabase) {
    const found = memory.getProjectByHandleSlug(handle, slug);
    if (!found) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({
      project: {
        id: found.project.id,
        title: found.project.title,
        slug: found.project.slug,
        intent: found.project.intent,
        handle: found.handle,
      },
      updates: memory.listUpdates(found.project.id),
    });
  }

  const user = await prisma.user.findFirst({
    where: { handle: { equals: handle, mode: "insensitive" } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await prisma.project.findFirst({
    where: { creatorId: user.id, slug },
    include: { updates: { orderBy: { number: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      intent: project.intent,
      handle: user.handle,
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
