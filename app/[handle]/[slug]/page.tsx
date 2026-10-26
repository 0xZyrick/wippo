import type { Metadata } from "next";
import { PublicLedger } from "@/components/PublicLedger";
import { hasDatabase, prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: { handle: string; slug: string };
}): Promise<Metadata> {
  const handle = params.handle.replace(/^@/, "");
  const slug = params.slug;
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.wippo.online"
  ).replace(/\/$/, "");

  let title = slug;
  let intent = "A living build record on Wippo";
  let milestones = "0";
  const updateTitles: string[] = [];

  if (hasDatabase) {
    try {
      const user = await prisma.user.findFirst({
        where: { handle: { equals: handle, mode: "insensitive" } },
      });
      if (user) {
        const project = await prisma.project.findFirst({
          where: { creatorId: user.id, slug },
          include: {
            updates: { orderBy: { number: "desc" }, take: 3 },
            _count: { select: { updates: true } },
          },
        });
        if (project) {
          title = project.title;
          intent = project.intent || intent;
          milestones = String(project._count.updates);
          for (const u of project.updates) {
            updateTitles.push(u.headline || `Update ${u.number}`);
          }
        }
      }
    } catch {
      /* fall through */
    }
  }

  const og = new URL(`${origin}/api/og`);
  og.searchParams.set("title", title);
  og.searchParams.set("handle", handle);
  og.searchParams.set("milestones", milestones);
  updateTitles.forEach((u, i) => og.searchParams.set(`u${i + 1}`, u));

  return {
    title: `${title} · @${handle} · Wippo`,
    description: intent,
    openGraph: {
      title: `${title} · @${handle}`,
      description: intent,
      url: `${origin}/${handle}/${slug}`,
      images: [{ url: og.toString(), width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · @${handle}`,
      description: intent,
      images: [og.toString()],
    },
  };
}

export default function PublicProjectPage({
  params,
}: {
  params: { handle: string; slug: string };
}) {
  return <PublicLedger handle={params.handle} slug={params.slug} />;
}
