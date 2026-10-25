import { PublicLedger } from "@/components/PublicLedger";

export function generateMetadata({
  params,
}: {
  params: { handle: string; slug: string };
}) {
  return { title: `${params.slug} · @${params.handle} · Wippo` };
}

export default function PublicProjectPage({
  params,
}: {
  params: { handle: string; slug: string };
}) {
  return (
    <PublicLedger handle={params.handle} slug={params.slug} />
  );
}
