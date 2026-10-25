import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const why = typeof body.why === "string" ? body.why.trim() : "";
  const headline =
    typeof body.headline === "string" && body.headline.trim()
      ? body.headline.trim()
      : "Update";
  const mediaUrl =
    typeof body.mediaUrl === "string" && body.mediaUrl.trim()
      ? body.mediaUrl.trim()
      : undefined;
  const mediaKind =
    typeof body.mediaKind === "string" && body.mediaKind.trim()
      ? body.mediaKind.trim()
      : undefined;

  if (why.length < 3) {
    return NextResponse.json({ error: "Add a short note on why this matters." }, { status: 400 });
  }

  if (!hasDatabase) {
    const found = memory.getProjectById(params.id);
    if (!found || found.project.creatorId !== user.id) {
      return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
    }
    const update = memory.commitUpdate(params.id, {
      headline,
      why,
      mediaUrl,
      mediaKind,
    });
    return NextResponse.json({ update });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.creatorId !== user.id) {
    return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  }
  const last = await prisma.projectUpdate.findFirst({
    where: { projectId: params.id },
    orderBy: { number: "desc" },
  });
  const number = (last?.number || 0) + 1;
  const update = await prisma.projectUpdate.create({
    data: {
      projectId: params.id,
      number,
      headline,
      why,
      mediaUrl: mediaUrl || null,
      mediaKind: mediaKind || null,
    },
  });
  await prisma.project.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
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
