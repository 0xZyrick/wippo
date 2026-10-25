import Link from "next/link";
import { getSessionUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getSessionUser();
  const ctaHref = user ? "/dashboard" : "/auth";
  const ctaLabel = user ? "Open dashboard" : "Get started free";

  return (
    <main className="min-h-full bg-[#121212] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#121212]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wippo-icon.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-semibold tracking-tight">Wippo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#B3B3B3]">
            <a href="#how" className="hover:text-white transition">
              How it works
            </a>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
            <Link href="/alex/orbit-mesh" className="hover:text-white transition">
              Example
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {!user && (
              <Link
                href="/auth"
                className="hidden sm:inline rounded-full px-4 py-2 text-[13px] font-medium text-[#B3B3B3] hover:text-white transition"
              >
                Log in
              </Link>
            )}
            <Link
              href={ctaHref}
              className="rounded-full bg-[#FF6B00] px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110 transition"
            >
              {user ? "Dashboard" : "Sign up free"}
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero — bold lime-ish energy like Linktree, Wippo orange accent */}
      <section className="bg-[#1a3a2a] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem] font-bold tracking-tight leading-[1.05]">
              A public ledger
              <br />
              built for makers.
            </h1>
            <p className="mt-5 max-w-md text-[16px] sm:text-[17px] text-white/75 leading-relaxed">
              Log real project updates. Share one clean link. Let people follow the
              work—not the hype.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="flex flex-1 items-center rounded-full bg-white px-4 py-3 text-[14px] text-[#121212]">
                <span className="text-[#6A6A6A] shrink-0">wippo.app/</span>
                <span className="ml-0.5 font-medium">you</span>
              </div>
              <Link
                href={ctaHref}
                className="shrink-0 rounded-full bg-[#FF6B00] px-6 py-3 text-center text-[14px] font-semibold text-white hover:brightness-110 transition"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl bg-[#121212] border border-white/10 p-5 shadow-2xl max-w-sm mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-[16px] font-bold">
                  O
                </div>
                <div>
                  <p className="text-[15px] font-semibold">Orbit Mesh</p>
                  <p className="text-[12px] text-[#B3B3B3]">3 updates · In progress</p>
                </div>
              </div>
              <div className="rounded-2xl bg-[#181818] p-4 space-y-2">
                <p className="text-[11px] font-semibold text-[#FF6B00]">Update 3</p>
                <p className="text-[14px] font-semibold">Public ledger page</p>
                <p className="text-[13px] text-[#B3B3B3] line-clamp-2">
                  Visitors time-travel the history without a social feed.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF6B00]" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Feature — create */}
      <section id="how" className="bg-[#1e3a5f]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl bg-[#121212]/40 border border-white/10 p-6 max-w-md">
              <div className="space-y-3">
                {["Log Update", "Add title & note", "Attach visual proof", "Share the link"].map(
                  (step, i) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-xl bg-[#181818] px-4 py-3"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FF6B00] text-[12px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-[14px] font-medium">{step}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-bold tracking-tight leading-tight">
              Create and ship your ledger in minutes
            </h2>
            <p className="mt-4 text-[16px] text-white/70 leading-relaxed max-w-md">
              No feed algorithms. No vanity metrics. One project, one timeline,
              updates that stack in order—from first note to launch.
            </p>
            <Link
              href={ctaHref}
              className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-[#121212] hover:bg-white/90 transition"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Share anywhere */}
      <section className="bg-[#5c1a2e]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[2rem] sm:text-[2.5rem] font-bold tracking-tight leading-tight">
              Share your project anywhere you like
            </h2>
            <p className="mt-4 text-[16px] text-white/70 leading-relaxed max-w-md">
              Drop your Wippo link in bios, decks, grant apps, and DMs. Anyone can
              follow the journey and jump to a specific update.
            </p>
            <Link
              href={ctaHref}
              className="mt-6 inline-block rounded-full border border-white/30 bg-transparent px-6 py-3 text-[14px] font-semibold text-white hover:bg-white/10 transition"
            >
              Claim your link
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
            {["X / Twitter", "Portfolio", "Grant form", "Pitch deck", "Discord", "Email"].map(
              (place) => (
                <span
                  key={place}
                  className="rounded-2xl bg-[#121212]/35 border border-white/15 px-4 py-3 text-[13px] font-medium"
                >
                  {place}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* 4. Features grid */}
      <section id="features" className="bg-[#e8f0e4] text-[#121212]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold tracking-tight text-center max-w-xl mx-auto leading-tight">
            Everything you need to show the work
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Chronological milestones",
                body: "Every update is numbered and ordered. No posts to bury the truth.",
                bg: "bg-[#c8e6c9]",
              },
              {
                title: "Visual proof",
                body: "Attach images or video so the update is evidence, not just words.",
                bg: "bg-[#bbdefb]",
              },
              {
                title: "Public page",
                body: "Identity on the side, update in the center, journey on the right.",
                bg: "bg-[#ffe0b2]",
              },
              {
                title: "Follow by email",
                body: "Let supporters get notified when you ship the next note.",
                bg: "bg-[#f8bbd0]",
              },
              {
                title: "One link",
                body: "wippo.app/you/project — stable, shareable, no social login wall.",
                bg: "bg-[#d1c4e9]",
              },
              {
                title: "Builder dashboard",
                body: "Log, preview on mobile, copy the link, keep shipping.",
                bg: "bg-[#b2dfdb]",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`rounded-3xl ${f.bg} p-6 min-h-[160px] flex flex-col`}
              >
                <h3 className="text-[17px] font-bold">{f.title}</h3>
                <p className="mt-2 text-[14px] text-[#121212]/70 leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Social proof strip */}
      <section className="bg-[#121212] border-y border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold tracking-tight">
            Built for people who ship in public
          </h2>
          <p className="mt-3 text-[15px] text-[#B3B3B3] max-w-lg mx-auto">
            Indie makers, onchain builders, and small teams who want a clean record—not
            another content treadmill.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["Hackathon builds", "Grant apps", "MVP logs", "Studio work", "Side projects"].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/15 px-4 py-2 text-[13px] text-[#B3B3B3]"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* 6. Quote */}
      <section className="bg-[#f5f5f5] text-[#121212]">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20 text-center">
          <p className="text-[1.35rem] sm:text-[1.65rem] font-semibold leading-snug tracking-tight">
            “Don’t turn your project into an exhausting marketing campaign. Keep a
            quiet ledger of what actually shipped.”
          </p>
          <p className="mt-6 text-[14px] text-[#6A6A6A]">— The idea behind Wippo</p>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="bg-[#3d0a1f]">
        <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
          <h2 className="text-[2rem] font-bold tracking-tight text-center mb-10">
            Questions? Answered
          </h2>
          <div className="space-y-2">
            {[
              {
                q: "Is Wippo free?",
                a: "You can start free, claim a handle, and publish a public project ledger.",
              },
              {
                q: "Who sees my updates?",
                a: "Anyone with the link. It’s a public timeline by design—built to share proof of work.",
              },
              {
                q: "Do followers need an account?",
                a: "No. They can read the ledger and optionally follow by email for new updates.",
              },
              {
                q: "Can I attach media?",
                a: "Yes. Images and video can sit with each update as visual proof.",
              },
              {
                q: "Is this a social network?",
                a: "No. No feed, no likes race—just your project history in order.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-[#121212]/35 border border-white/10 open:bg-[#121212]/50"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-medium flex items-center justify-between">
                  {item.q}
                  <span className="text-white/40 group-open:rotate-45 transition text-[20px] leading-none">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-[14px] text-white/65 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="bg-[#2a1a4a]">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20 text-center">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold tracking-tight leading-tight">
            Start your project ledger today
          </h2>
          <p className="mt-4 text-[16px] text-white/70">
            One link. Ordered updates. Real proof you can share.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <div className="flex flex-1 items-center rounded-full bg-white px-4 py-3 text-[14px] text-[#121212]">
              <span className="text-[#6A6A6A]">wippo.app/</span>
              <span className="ml-0.5 font-medium">you</span>
            </div>
            <Link
              href={ctaHref}
              className="rounded-full bg-[#FF6B00] px-6 py-3 text-[14px] font-semibold text-white hover:brightness-110 transition"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#121212] border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wippo-icon.png" alt="" className="h-6 w-6 object-contain" />
            <span className="text-[14px] font-semibold">Wippo</span>
          </div>
          <div className="flex flex-wrap gap-5 text-[13px] text-[#B3B3B3]">
            <Link href="/auth" className="hover:text-white transition">
              Log in
            </Link>
            <Link href={ctaHref} className="hover:text-white transition">
              Get started
            </Link>
            <Link href="/alex/orbit-mesh" className="hover:text-white transition">
              Example project
            </Link>
          </div>
          <p className="text-[12px] text-[#6A6A6A]">Home of making</p>
        </div>
      </footer>
    </main>
  );
}
