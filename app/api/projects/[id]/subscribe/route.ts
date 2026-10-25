import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/db";
import { memory } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!hasDatabase) {
    if (!memory.getProjectById(params.id)) {
      return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
    }
    memory.subscribe(params.id, email);
    return NextResponse.json({ ok: true, email });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "We could not find that project." }, { status: 404 });
  await prisma.projectEmailSubscriber.upsert({
    where: { projectId_email: { projectId: params.id, email } },
    create: { projectId: params.id, email },
    update: {},
  });
  return NextResponse.json({ ok: true, email });
}
