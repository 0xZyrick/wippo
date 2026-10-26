import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { WorkspaceClient } from "@/components/WorkspaceClient";

export const metadata = { title: "Dashboard · Wippo" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  return (
    <main className="min-h-full bg-[#121212]">
      <WorkspaceClient
        handle={user.handle}
        email={user.email}
        displayName={user.displayName || user.handle}
      />
    </main>
  );
}
