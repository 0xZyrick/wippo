import Link from "next/link";
import { getSessionUser } from "@/lib/session";

/* Palette: brand black + orange, with a warm cream for contrast sections */
const ORANGE = "#FF6B00";
const CREAM = "#F6F0E6";
const INK = "#121212";

function ClaimForm({
  loggedIn,
  tone,
}: {
  loggedIn: boolean;
  tone: "orange" | "dark";
}) {
  if (loggedIn) {
    return (
      <Link
        href="/dashboard"
        className={`inline-flex rounded-full px-7 py-3.5 text-[15px] font-semibold transition hover:brightness-110 ${
          tone === "orange" ? "bg-[#121212] text-white" : "bg-[#FF6B00] text-white"
        }`}
      >
        Open dashboard
      </Link>
    );
  }
  return (
    <form
      action="/auth"
      method="get"
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label className="flex flex-1 items-center rounded-full bg-white px-5 py-3.5 text-[15px] text-[#121212] shadow-sm focus-within:ring-2 focus-within:ring-[#121212]">
        <span className="text-[#121212]/50">wippo.app/</span>
        <input
          name="handle"
          placeholder="yourname"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-[#121212]/30"
        />
      </label>
      <button
        type="submit"
        className={`shrink-0 whitespace-nowrap rounded-full px-7 py-3.5 text-[15px] font-semibold transition hover:brightness-110 ${
          tone === "orange" ? "bg-[#121212] text-white" : "bg-[#FF6B00] text-white"
        }`}
      >
        Claim your link
      </button>
    </form>
  );
}

function PhoneMock() {
  const updates = [
    { n: 12, title: "Mesh routing is live", note: "Nodes now find each other in under 2s.", tag: "Shipped" },
    { n: 11, title: "Prototype v3 on the bench", note: "Power draw down 31%. Photos below.", tag: "Update" },
    { n: 10, title: "Custom antenna tested", note: "Range doubled outdoors.", tag: "Update" },
  ];
  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px]">
      <div className="rounded-[2.5rem] border-[6px] border-[#121212] bg-[#181818] p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/15" />
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#FF6B00] text-[15px] font-bold">
            A
          </div>
          <div>
            <p className="text-[14px] font-semibold leading-tight text-white">Orbit Mesh</p>
            <p className="text-[12px] text-[#B3B3B3]">wippo.app/alex/orbit-mesh</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 text-[11px] font-medium">
          <span className="rounded-full bg-[#FF6B00]/15 px-3 py-1 text-[#FF6B00]">12 updates</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[#B3B3B3]">248 followers</span>
        </div>
        <ol className="relative mt-5 space-y-3">
          <span className="absolute left-[13px] top-3 bottom-3 w-px bg-white/10" />
          {updates.map((u) => (
            <li key={u.n} className="relative flex gap-3">
              <span className="z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FF6B00] text-[11px] font-bold text-white">
                {u.n}
              </span>
              <div className="flex-1 rounded-2xl bg-[#242424] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-white">{u.title}</p>
                  <span className="text-[10px] text-[#6A6A6A]">{u.tag}</span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-[#B3B3B3]">{u.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-full bg-white/10 py-2.5 text-center text-[12px] font-medium text-white">
          Follow by email
        </div>
      </div>
      {/* floating chips */}
      <div className="absolute -left-14 top-1/2 hidden rotate-[-6deg] rounded-2xl bg-white px-4 py-2.5 text-[12px] font-semibold text-[#121212] shadow-xl lg:block">
        New update logged
      </div>
      <div className="absolute -right-14 bottom-10 hidden rotate-[5deg] rounded-2xl bg-[#121212] px-4 py-2.5 text-[12px] font-semibold text-white shadow-xl ring-1 ring-white/10 lg:block">
        +24 followers this week
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const user = await getSessionUser();
  const ctaHref = user ? "/dashboard" : "/auth";
  const ctaLabel = user ? "Open dashboard" : "Start your ledger";

  return (
    <main className="min-h-full bg-[#121212] text-white">
      {/* Floating pill nav */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-white px-4 py-2.5 text-[#121212] shadow-lg">
          <div className="flex items-center gap-2 pl-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wippo-icon.png" alt="" className="h-6 w-6 object-contain" />
            <span className="text-[16px] font-bold tracking-tight">Wippo</span>
          </div>
          <nav className="hidden items-center gap-6 text-[14px] font-medium text-[#121212]/70 sm:flex">
            <a href="#how" className="hover:text-[#121212] transition">How it works</a>
            <a href="#features" className="hover:text-[#121212] transition">Features</a>
          </nav>
          <div className="flex items-center gap-1.5">
            {!user && (
              <Link
                href="/auth"
                className="rounded-full px-4 py-2 text-[13px] font-semibold hover:bg-black/5 transition"
              >
                Log in
              </Link>
            )}
            <Link
              href={ctaHref}
              className="rounded-full bg-[#121212] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black transition"
            >
              {user ? "Dashboard" : "Sign up free"}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — bold orange */}
      <section style={{ background: ORANGE }} className="text-[#121212]">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 pb-20 pt-32 sm:pt-40 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
          <div>
            <h1 className="text-[2.9rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[4.25rem]">
              Your work,
              <br />
              on the record.
            </h1>
            <p className="mt-6 max-w-md text-[17px] font-medium leading-relaxed text-[#121212]/80">
              Wippo is a public ledger for what you ship. Log updates in order,
              share one link, and let people follow along. No feed, no noise.
            </p>
            <div className="mt-8">
              <ClaimForm loggedIn={!!user} tone="orange" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-[#121212]/70">
              Free to start.
            </p>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* HOW IT WORKS — cream */}
      <section id="how" style={{ background: CREAM }} className="text-[#121212]">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24">
          <h2 className="max-w-xl text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.025em] sm:text-[3rem]">
            Create it in minutes. Keep it going for years.
          </h2>
          <ol className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { n: "01", title: "Create a project", body: "Name it, set the intent, and get a stable public URL that never changes." },
              { n: "02", title: "Log updates", body: "Add numbered milestones with notes, images or video as proof." },
              { n: "03", title: "Share the link", body: "Anyone can read the timeline. Followers get an email on every new update." },
            ].map((s) => (
              <li key={s.n} className="rounded-3xl bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <span className="text-[13px] font-bold" style={{ color: ORANGE }}>
                  {s.n}
                </span>
                <h3 className="mt-6 text-[19px] font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#121212]/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FEATURES — dark bento */}
      <section id="features" className="bg-[#121212]">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
            Built for proof of work
          </p>
          <h2 className="mt-3 max-w-xl text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.025em] sm:text-[3rem]">
            A record people can actually trust.
          </h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-6">
            {/* big card */}
            <div className="rounded-3xl bg-[#181818] p-7 ring-1 ring-white/10 sm:col-span-4">
              <h3 className="text-[22px] font-bold tracking-tight">Ordered updates</h3>
              <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[#B3B3B3]">
                Every update gets a number. The timeline reads top to bottom, so
                the story is never buried under a feed.
              </p>
              <div className="mt-8 flex items-end gap-2">
                {[28, 44, 36, 62, 54, 80, 96].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-xl"
                    style={{
                      height: h,
                      background: i === 6 ? ORANGE : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* orange card */}
            <div className="flex flex-col justify-between rounded-3xl p-7 text-[#121212] sm:col-span-2" style={{ background: ORANGE }}>
              <h3 className="text-[22px] font-bold leading-tight tracking-tight">
                One link per project
              </h3>
              <p className="mt-10 break-all rounded-2xl bg-[#121212] px-4 py-3 text-[13px] font-medium text-white">
                wippo.app/you/project
              </p>
            </div>

            {/* cream card */}
            <div className="rounded-3xl p-7 text-[#121212] sm:col-span-3" style={{ background: CREAM }}>
              <h3 className="text-[22px] font-bold tracking-tight">Email follow</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#121212]/65">
                Followers opt in and get a note the moment you ship the next update.
              </p>
              <div className="mt-6 rounded-2xl bg-white p-4 text-[13px] shadow-sm">
                <p className="font-semibold">Orbit Mesh · Update #13</p>
                <p className="mt-0.5 text-[#121212]/60">Field test results are in.</p>
              </div>
            </div>

            {/* media card */}
            <div className="rounded-3xl bg-[#181818] p-7 ring-1 ring-white/10 sm:col-span-3">
              <h3 className="text-[22px] font-bold tracking-tight">Visual proof</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#B3B3B3]">
                Attach images and video to any update, so the work speaks for itself.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#7a2f00]" />
                <div className="aspect-square rounded-2xl bg-[#242424]" />
                <div className="relative aspect-square rounded-2xl bg-[#2a2a2a]">
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[12px] text-[#121212]">
                      ▶
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — orange */}
      <section style={{ background: ORANGE }} className="text-[#121212]">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24">
          <h2 className="max-w-2xl text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[3.5rem]">
            Start logging what you ship today.
          </h2>
          <div className="mt-8">
            <ClaimForm loggedIn={!!user} tone="orange" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#121212]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wippo-icon.png" alt="" className="h-5 w-5 object-contain" />
            <span className="text-[14px] font-semibold">Wippo</span>
            <span className="text-[12px] text-[#6A6A6A]">Home of making</span>
          </div>
          <div className="flex gap-6 text-[13px] text-[#B3B3B3]">
            <Link href="/auth" className="hover:text-white transition">Log in</Link>
            <Link href={ctaHref} className="hover:text-white transition">{ctaLabel}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
