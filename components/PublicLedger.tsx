"use client";

/**
 * Public project page
 * Desktop: faded-color identity sidebar · media-first update center · journey right
 * Mobile: home (identity + journey) · update detail (media top, info below)
 * Deep, low-opacity accent wash — never solid / high-contrast color blocks
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Clock,
  Home,
  List,
  Activity,
} from "lucide-react";
import { parseUpdateParam, updateLabel } from "@/lib/slug";
import type { UpdateDTO } from "@/lib/types";

type ProjectInfo = {
  id: string;
  title: string;
  slug: string;
  intent: string;
  handle: string;
};

function isVideo(url?: string | null) {
  return !!url && /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function readMins(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

/** Soft project accent from title hash — kept very low opacity in use */
function accentFromTitle(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return {
    wash: `hsla(${hue}, 28%, 22%, 0.22)`,
    washEdge: `hsla(${hue}, 24%, 18%, 0)`,
  };
}

export function PublicLedger({ handle, slug }: { handle: string; slug: string }) {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [updates, setUpdates] = useState<UpdateDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followOpen, setFollowOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [followMsg, setFollowMsg] = useState("");
  const [followBusy, setFollowBusy] = useState(false);
  const [following, setFollowing] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [shared, setShared] = useState(false);
  /** mobile: home | update — deep links land on update when ?u= is present */
  const [mobileTab, setMobileTab] = useState<"home" | "update">("update");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/public/${encodeURIComponent(handle)}/${encodeURIComponent(slug)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "This project could not be found.");
      setProject(data.project);
      const list: UpdateDTO[] = data.updates || [];
      setUpdates(list);
      const want =
        typeof window !== "undefined"
          ? parseUpdateParam(new URLSearchParams(window.location.search).get("u"))
          : null;
      const match = want ? list.find((u) => u.number === want) : null;
      const pick = match || list[list.length - 1] || null;
      setActiveId(pick?.id || null);
      // With updates: open update view (link opens update). Bare empty project → home
      setMobileTab(list.length ? "update" : "home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [handle, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const chronological = useMemo(
    () => [...updates].sort((a, b) => b.number - a.number),
    [updates]
  );

  const ascending = useMemo(
    () => [...updates].sort((a, b) => a.number - b.number),
    [updates]
  );

  const active = useMemo(
    () => updates.find((u) => u.id === activeId) || chronological[0] || null,
    [updates, activeId, chronological]
  );

  const mediaList = useMemo(() => {
    if (!active?.mediaUrl) return [] as string[];
    return [active.mediaUrl];
  }, [active]);

  useEffect(() => {
    setMediaIndex(0);
  }, [active?.id]);

  const select = (u: UpdateDTO) => {
    setActiveId(u.id);
    setMobileTab("update");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("u", String(u.number));
      window.history.replaceState({}, "", url.toString());
    }
  };

  const goPrevNext = (dir: -1 | 1) => {
    if (!active) return;
    const idx = ascending.findIndex((u) => u.id === active.id);
    const next = ascending[idx + dir];
    if (next) select(next);
  };

  const subscribe = async () => {
    if (!project) return;
    const e = email.trim().toLowerCase();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setFollowMsg("Enter a valid email.");
      return;
    }
    setFollowBusy(true);
    setFollowMsg("");
    try {
      const res = await fetch(`/api/projects/${project.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setFollowOpen(false);
      setFollowing(true);
      setFollowMsg("You'll be notified on new updates.");
    } catch (err) {
      setFollowMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setFollowBusy(false);
    }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const currentMedia = mediaList[mediaIndex] || null;
  const video = isVideo(currentMedia);
  const hasMedia = !!currentMedia;
  const accent = accentFromTitle(project?.title || "wippo");
  const latest = chronological[0] || null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/wippo-icon.png"
          alt=""
          className="h-10 w-10 object-contain animate-pulse"
        />
      </div>
    );
  }

  if (error) {
    return (
      <p className="px-4 py-12 text-center text-[13px] text-red-400 bg-[#121212] min-h-screen">
        {error}
      </p>
    );
  }

  if (!project) return null;

  const IdentityBlock = () => (
    <div className="max-w-[220px]">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-white/[0.06] text-[20px] font-semibold text-[#FFFFFF]">
        {project.title.slice(0, 1).toUpperCase()}
      </div>
      <h1 className="mt-4 text-[1.25rem] font-semibold tracking-tight text-white leading-tight">
        {project.title}
      </h1>
      <p className="mt-2 text-[13px] text-[#B3B3B3] leading-relaxed">
        {project.intent || "A living record of this project."}
      </p>
      <div className="mt-3 space-y-1 text-[12px] text-[#B3B3B3]">
        <p className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          In progress
        </p>
        <p>{updates.length} updates</p>
        <p className="text-[#B3B3B3]">@{project.handle}</p>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setFollowOpen(true)}
          className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-white/[0.07] transition"
        >
          {following ? "Following" : "Follow project"}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="w-full rounded-full border border-white/[0.08] bg-transparent px-4 py-2.5 text-[12px] font-medium text-[#B3B3B3] hover:text-white transition"
        >
          {shared ? "Link copied" : "Share"}
        </button>
      </div>
    </div>
  );

  const JourneyList = () => (
    <ol className="relative">
      <div
        className="pointer-events-none absolute left-[18px] top-3 bottom-3 w-px bg-white/[0.07]"
        aria-hidden
      />
      {chronological.map((u) => {
        const on = u.id === active?.id && mobileTab === "update";
        return (
          <li key={u.id} className="mb-0.5">
            <button
              type="button"
              onClick={() => select(u)}
              className={`relative flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                on ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              }`}
            >
              <span className="relative z-[1] mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    on ? "bg-[#FF6B00] ring-4 ring-[#FF6B00]/20" : "bg-white/20"
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[12px] font-semibold ${
                    on ? "text-[#FF6B00]" : "text-[#B3B3B3]"
                  }`}
                >
                  {updateLabel(u.number)}
                </span>
                <span className="mt-0.5 block text-[13px] text-[#FFFFFF]/90 leading-snug line-clamp-2">
                  {u.headline || "Untitled"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
      {!chronological.length && (
        <p className="px-3 py-8 text-[12px] text-[#B3B3B3]">No updates yet.</p>
      )}
    </ol>
  );

  const UpdateBody = () => {
    if (!active) {
      return (
        <p className="py-16 text-center text-[14px] text-[#B3B3B3]">
          No updates yet.
        </p>
      );
    }
    return (
      <article className="w-full">
        {hasMedia && (
          <section className="relative mb-5">
            <div
              className={`relative overflow-hidden rounded-2xl bg-black/40 ${
                video
                  ? "mx-auto max-w-sm aspect-[9/16] sm:max-w-xs"
                  : "aspect-[16/10] w-full"
              }`}
            >
              {video ? (
                <video
                  key={currentMedia}
                  src={currentMedia!}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentMedia!}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((i) => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white/80"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaIndex((i) => Math.min(mediaList.length - 1, i + 1))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white/80"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-[#181818]/90 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-[#FF6B00]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF6B00]">
              {updateLabel(active.number)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#B3B3B3]">
              <Clock size={11} />
              {readMins(active.why || active.headline || "")} min read
            </span>
            <span className="text-[11px] text-[#B3B3B3]">
              {new Date(active.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h2
            className={`font-semibold tracking-tight text-white leading-snug ${
              hasMedia
                ? "text-[1.25rem] sm:text-[1.4rem]"
                : "text-[1.5rem] sm:text-[1.7rem]"
            }`}
          >
            {active.headline || updateLabel(active.number)}
          </h2>

          <p className="mt-3 text-[15px] leading-relaxed text-[#D0D0D0] whitespace-pre-wrap">
            {active.why}
          </p>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => goPrevNext(-1)}
              className="rounded-full border border-white/[0.08] px-3.5 py-2 text-[12px] text-[#B3B3B3] hover:text-white hover:bg-white/[0.04] transition"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => goPrevNext(1)}
              className="rounded-full border border-white/[0.08] px-3.5 py-2 text-[12px] text-[#B3B3B3] hover:text-white hover:bg-white/[0.04] transition"
            >
              Next →
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-2 text-[12px] text-[#FFFFFF] hover:bg-white/[0.09] transition"
            >
              <Share2 size={12} />
              {shared ? "Copied" : "Share"}
            </button>
          </div>
        </section>
      </article>
    );
  };

  return (
    <div className="min-h-full bg-[#121212] text-[#f5f5f5]">
      {/* ════════════ DESKTOP ════════════ */}
      <div className="hidden lg:grid lg:grid-cols-[240px_1fr_280px] lg:min-h-screen max-w-[1400px] mx-auto">
        {/* Left identity — deep opacity faded wash only */}
        <aside
          className="relative sticky top-0 h-screen flex flex-col justify-center px-6 border-r border-white/[0.05] overflow-hidden"
          style={{
            background: `linear-gradient(165deg, ${accent.wash} 0%, ${accent.washEdge} 55%, transparent 100%)`,
          }}
        >
          <div className="relative z-[1]">
            <IdentityBlock />
          </div>
        </aside>

        {/* Center — media top, info under */}
        <main className="min-w-0 px-8 py-10 flex flex-col justify-center">
          <div className="w-full max-w-2xl mx-auto">
            <UpdateBody />
          </div>
        </main>

        {/* Right journey */}
        <aside className="sticky top-0 h-screen border-l border-white/[0.05] bg-[#121212]/80 flex flex-col">
          <div className="px-5 pt-6 pb-4 border-b border-white/[0.05]">
            <p className="text-[11px] text-[#B3B3B3]">Building something too?</p>
            <Link
              href="/auth"
              className="mt-1 inline-block text-[12px] font-medium text-[#B3B3B3] hover:text-white transition"
            >
              Join Wippo
            </Link>
          </div>
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B3B3B3]">
              Project journey
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            <JourneyList />
          </div>
        </aside>
      </div>

      {/* ════════════ MOBILE ════════════ */}
      <div className="lg:hidden min-h-screen flex flex-col pb-16">
        {mobileTab === "home" && (
          <div className="flex-1">
            <div
              className="relative px-5 pt-10 pb-6 overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${accent.wash} 0%, transparent 100%)`,
              }}
            >
              <div className="relative z-[1]">
                <div className="flex items-center gap-2 mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/wippo-icon.png"
                    alt=""
                    className="h-6 w-6 object-contain opacity-80"
                  />
                  <span className="text-[12px] font-medium text-[#B3B3B3]">wippo</span>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.06] text-[22px] font-semibold text-white">
                  {project.title.slice(0, 1).toUpperCase()}
                </div>
                <h1 className="mt-4 text-[1.75rem] font-semibold tracking-tight text-white">
                  {project.title}
                </h1>
                <p className="mt-2 text-[14px] text-[#B3B3B3] leading-relaxed">
                  {project.intent || "A living record of this project."}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#B3B3B3]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                    In progress
                  </span>
                  <span>{updates.length} updates</span>
                  <span className="text-[#B3B3B3]">@{project.handle}</span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFollowOpen(true)}
                    className="flex-1 rounded-full bg-white text-[#121212] py-2.5 text-[13px] font-semibold"
                  >
                    {following ? "Following" : "Follow project"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-[13px] font-medium text-[#FFFFFF]"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>

            {latest && (
              <button
                type="button"
                onClick={() => select(latest)}
                className="mx-4 mt-2 w-[calc(100%-2rem)] text-left rounded-2xl bg-[#181818] p-4 hover:bg-[#1a1a1a] transition"
              >
                <p className="text-[11px] font-medium text-[#FF6B00]">
                  Latest · {updateLabel(latest.number)}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-white">
                  {latest.headline || "Update"}
                </p>
                <p className="mt-1 text-[13px] text-[#B3B3B3] line-clamp-2">
                  {latest.why}
                </p>
              </button>
            )}

            <div className="px-4 pt-6 pb-4">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B3B3B3] mb-2">
                Project journey
              </h3>
              <JourneyList />
            </div>
          </div>
        )}

        {mobileTab === "update" && (
          <div className="flex-1 px-4 pt-4 pb-6">
            <button
              type="button"
              onClick={() => setMobileTab("home")}
              className="mb-4 inline-flex items-center gap-1 text-[13px] text-[#B3B3B3] hover:text-white"
            >
              <ChevronLeft size={16} />
              {project.title}
            </button>
            <UpdateBody />
          </div>
        )}

        <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-white/[0.08] bg-[#121212]/95 backdrop-blur-md">
          <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setMobileTab("home")}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
                mobileTab === "home" ? "text-white" : "text-[#B3B3B3]"
              }`}
            >
              <Home size={18} strokeWidth={1.75} />
              Project
            </button>
            <button
              type="button"
              onClick={() => {
                if (latest) select(latest);
                else setMobileTab("update");
              }}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
                mobileTab === "update" ? "text-white" : "text-[#B3B3B3]"
              }`}
            >
              <List size={18} strokeWidth={1.75} />
              Updates
            </button>
            <span className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-[#505050]">
              <Activity size={18} strokeWidth={1.75} />
              Activity
            </span>
          </div>
        </nav>
      </div>

      {followOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !followBusy) setFollowOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#181818] p-6 shadow-2xl">
            <h2 className="text-[16px] font-semibold text-white">Follow project</h2>
            <p className="mt-1 text-[13px] text-[#B3B3B3]">
              Get an email when a new update drops.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-4 w-full rounded-xl bg-[#181818] px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#B3B3B3] outline-none focus:ring-1 focus:ring-white/15"
            />
            {followMsg && (
              <p className="mt-2 text-[12px] text-[#B3B3B3]">{followMsg}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={followBusy}
                onClick={() => void subscribe()}
                className="flex-1 rounded-xl bg-[#FF6B00] py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {followBusy ? "Saving…" : "Follow"}
              </button>
              <button
                type="button"
                disabled={followBusy}
                onClick={() => setFollowOpen(false)}
                className="rounded-xl px-4 py-2.5 text-[13px] text-[#B3B3B3] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
