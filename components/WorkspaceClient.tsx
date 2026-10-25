"use client";

/**
 * Creator Dashboard — simple side icons, inline project edit, milestone-first flow.
 */
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Settings,
  HelpCircle,
  Plus,
  LogOut,
  Upload,
  X,
  ExternalLink,
  ImageIcon,
  Pencil,
  Link2,
  Globe,
  ChevronDown,
  Check,
} from "lucide-react";
import { updateLabel } from "@/lib/slug";
import type { ProjectDTO, UpdateDTO } from "@/lib/types";

type StagedFile = { id: string; file: File; preview: string };

type ProjectLinks = {
  x?: string;
  website?: string;
  other?: string;
};

export function WorkspaceClient({ handle }: { handle: string }) {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<UpdateDTO[]>([]);
  const [headline, setHeadline] = useState("");
  const [why, setWhy] = useState("");
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [nav, setNav] = useState<"projects" | "settings" | "help">("projects");
  const [showComposer, setShowComposer] = useState(false);

  // Inline editable project fields
  const [editTitle, setEditTitle] = useState("");
  const [editIntent, setEditIntent] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingIntent, setEditingIntent] = useState(false);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const [links, setLinks] = useState<ProjectLinks>({});
  const [editingLinks, setEditingLinks] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewingUpdateId, setViewingUpdateId] = useState<string | null>(null);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const publicUrl = useMemo(() => {
    if (!selected) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${handle}/${selected.slug}`;
  }, [selected, handle]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load. Please try again.");
      setProjects(data.projects || []);
      setSelectedId((id) => id || data.projects?.[0]?.id || null);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadUpdates = useCallback(async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    setUpdates(data.updates || []);
  }, []);

  useEffect(() => {
    void loadProjects().catch((e) => setError(e.message));
  }, [loadProjects]);

  useEffect(() => {
    if (selectedId) {
      void loadUpdates(selectedId).catch((e) => setError(e.message));
      setShowComposer(false);
    }
  }, [selectedId, loadUpdates]);

  useEffect(() => {
    if (selected) {
      setEditTitle(selected.title);
      setEditIntent(selected.intent || "");
      setProjectImagePreview(null);
      setEditingName(false);
      setEditingIntent(false);
      // links may live on extended DTO later; keep local for now
      const anyP = selected as ProjectDTO & { links?: ProjectLinks };
      setLinks(anyP.links || {});
      setEditingLinks(false);
    }
  }, [selected]);

  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list).filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type.startsWith("video/") ||
        f.type.startsWith("audio/")
    );
    if (!arr.length) {
      setError("Images, videos, or audio only.");
      return;
    }
    const next: StagedFile[] = arr.slice(0, 8).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setStaged((prev) => {
      const merged = [...prev, ...next].slice(0, 8);
      setStageIndex(Math.max(0, merged.length - next.length));
      return merged;
    });
    setError("");
  };

  const removeStaged = (id: string) => {
    setStaged((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      const next = prev.filter((s) => s.id !== id);
      setStageIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const createProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), intent: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the project. Please try again.");
      setNewTitle("");
      setShowNew(false);
      await loadProjects();
      setSelectedId(data.project.id);
      setShowComposer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const persistProject = async (patch: {
    title?: string;
    intent?: string;
    links?: ProjectLinks;
  }) => {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save. Please try again.");
      await loadProjects();
      setToast("Saved");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const commitName = async () => {
    if (!editTitle.trim() || editTitle.trim() === selected?.title) {
      setEditingName(false);
      setEditTitle(selected?.title || "");
      return;
    }
    await persistProject({ title: editTitle.trim() });
    setEditingName(false);
  };

  const commitIntent = async () => {
    if (editIntent.trim() === (selected?.intent || "")) {
      setEditingIntent(false);
      return;
    }
    await persistProject({ intent: editIntent.trim() });
    setEditingIntent(false);
  };

  const commitLinks = async () => {
    await persistProject({ links });
    setEditingLinks(false);
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const commit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || why.trim().length < 3) return;
    setBusy(true);
    setError("");
    setToast("");
    try {
      let mediaUrl: string | undefined;
      let mediaKind: string | undefined;
      const first = staged[0];
      if (first) {
        // Prefer Neon Object Storage when available; fall back to data URL.
        try {
          const form = new FormData();
          form.append("file", first.file);
          const up = await fetch("/api/upload", { method: "POST", body: form });
          const upData = await up.json();
          if (up.ok && upData.url) {
            mediaUrl = upData.url;
            mediaKind = upData.mediaKind;
          } else {
            mediaUrl = await fileToDataUrl(first.file);
            mediaKind = first.file.type.startsWith("video/")
              ? "video"
              : first.file.type.startsWith("audio/")
                ? "audio"
                : "image";
          }
        } catch {
          mediaUrl = await fileToDataUrl(first.file);
          mediaKind = first.file.type.startsWith("video/")
            ? "video"
            : first.file.type.startsWith("audio/")
              ? "audio"
              : "image";
        }
      }

      const res = await fetch(`/api/projects/${selectedId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim() || undefined,
          why: why.trim(),
          mediaUrl,
          mediaKind,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not publish that update. Please try again.");
      setHeadline("");
      setWhy("");
      staged.forEach((s) => URL.revokeObjectURL(s.preview));
      setStaged([]);
      setStageIndex(0);
      setShowComposer(false);
      await loadUpdates(selectedId);
      await loadProjects();
      const n = data.update?.number;
      const path = selected ? `/${handle}/${selected.slug}?u=${n}` : "/";
      const link = `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
      try {
        await navigator.clipboard.writeText(link);
        setToast(`${updateLabel(n)} saved · link copied`);
      } catch {
        setToast(`${updateLabel(n)} saved`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const activeStage = staged[stageIndex] || null;
  const chronological = useMemo(
    () => [...updates].sort((a, b) => a.number - b.number),
    [updates]
  );

  const navItems = [
    { id: "projects" as const, label: "Projects", Icon: FolderKanban },
    { id: "settings" as const, label: "Edit", Icon: Settings },
    { id: "help" as const, label: "Help", Icon: HelpCircle },
  ] as const;

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-[#121212] text-[#fafafa]">
      {/* Side nav — icon only, breathing room */}
      <nav className="hidden md:flex sticky top-0 h-screen w-[72px] shrink-0 flex-col items-center py-5 gap-5 ml-1">
        <div className="mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/wippo-icon.png"
            alt="Wippo"
            className="h-8 w-8 object-contain"
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {navItems.map(({ id, label, Icon }) => {
            const on = nav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setNav(id)}
                title={label}
                className="flex flex-col items-center gap-1.5 transition"
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full transition ${
                    on
                      ? "bg-white text-[#121212]"
                      : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    on ? "text-white" : "text-white/35"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="grid h-10 w-10 place-items-center rounded-full text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        </form>
      </nav>

      {/* Main — space from the rail */}
      <div className="flex-1 min-w-0 overflow-y-auto pl-1 md:pl-3">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-[#121212]/95 px-4 h-12 backdrop-blur">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wippo-icon.png" alt="" className="h-7 w-7 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wippo-logo.png" alt="Wippo" className="h-5 w-auto object-contain" />
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-[12px] text-white/45">
              Sign out
            </button>
          </form>
        </header>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5">
          {loadingProjects && (
            <div className="flex min-h-[50vh] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/wippo-icon.png"
                alt=""
                className="h-10 w-10 object-contain animate-pulse"
              />
            </div>
          )}

          {!loadingProjects && nav !== "projects" && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#181818] p-10 text-center text-[14px] text-white/40">
              {nav === "settings" ? "Account edit — coming soon." : "Help coming soon."}
            </div>
          )}

          {!loadingProjects && nav === "projects" && (
            <>
              {/* Project dropdown — centered at top */}
              <div className="mb-6 flex justify-center relative">
                {projects.length > 0 && selected ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProjectMenuOpen((o) => !o)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#181818] pl-1.5 pr-3 py-1.5 text-[13px] font-medium text-white hover:bg-white/[0.06] transition"
                    >
                      {projectImagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={projectImagePreview}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-[11px] font-semibold">
                          {selected.title.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="max-w-[140px] truncate">{selected.title}</span>
                      <ChevronDown
                        size={14}
                        className={`text-white/40 transition ${projectMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {projectMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setProjectMenuOpen(false)}
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-72 rounded-2xl border border-white/[0.08] bg-[#181818] p-2 shadow-2xl">
                          {projects.map((p) => {
                            const on = p.id === selectedId;
                            const isSel = p.id === selected?.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedId(p.id);
                                  setProjectMenuOpen(false);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-white/[0.06] transition"
                              >
                                {isSel && projectImagePreview ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={projectImagePreview}
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-[12px] font-semibold">
                                    {p.title.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-medium text-white truncate">
                                    {p.title}
                                  </span>
                                  <span className="block text-[11px] text-white/35 truncate">
                                    /{handle}/{p.slug}
                                  </span>
                                </span>
                                {on && (
                                  <Check size={16} className="text-[#FF6B00] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                          <div className="my-1.5 h-px bg-white/[0.06]" />
                          <button
                            type="button"
                            onClick={() => {
                              setProjectMenuOpen(false);
                              setNewTitle("");
                              setShowNew(true);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-white/[0.06] transition"
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-white/20 text-white/50">
                              <Plus size={16} />
                            </span>
                            <span className="text-[13px] font-medium text-white/70">
                              New project
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : projects.length === 0 ? (
                  <h1 className="text-[16px] font-semibold tracking-tight">My Projects</h1>
                ) : null}
              </div>

              {error && (
                <p className="mb-3 text-[13px] text-red-400" role="alert">
                  {error}
                </p>
              )}
              {toast && (
                <p className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-300">
                  {toast}
                </p>
              )}

              {selected && (
                /* Left: project + updates · Right: public preview (mobile viewport) + copy link */
                <div className="grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-5 items-start">
                  <div className="space-y-4 min-w-0">
                  {/* Project header — inline editable */}
                  <div className="rounded-2xl bg-[#181818] p-5">
                    <div className="flex items-start gap-3.5">
                      {/* Image — click to change */}
                      <label className="relative group shrink-0 cursor-pointer">
                        {projectImagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={projectImagePreview}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#242424] text-[#FF6B00]">
                            <FolderKanban size={24} strokeWidth={1.75} />
                          </div>
                        )}
                        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition">
                          <Pencil size={14} className="text-white" />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              if (projectImagePreview) URL.revokeObjectURL(projectImagePreview);
                              setProjectImagePreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                      </label>

                      <div className="min-w-0 flex-1">
                        {/* Name — click to edit on the spot */}
                        {editingName ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void commitName();
                                }
                                if (e.key === "Escape") {
                                  setEditTitle(selected.title);
                                  setEditingName(false);
                                }
                              }}
                              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#121212] px-2.5 py-1 text-[17px] font-semibold text-white outline-none focus:border-[#FF6B00]/40"
                            />
                            <button
                              type="button"
                              onClick={() => void commitName()}
                              className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditTitle(selected.title);
                                setEditingName(false);
                              }}
                              className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-[#B3B3B3] hover:text-white"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingName(true)}
                            className="group flex items-center gap-2 text-left"
                          >
                            <h1 className="text-[17px] font-semibold tracking-tight text-white">
                              {selected.title}
                            </h1>
                            <Pencil
                              size={12}
                              className="text-white/25 opacity-0 group-hover:opacity-100 transition"
                            />
                          </button>
                        )}

                        {/* Description — same pattern as title: hover edit, ✓ / ✕ */}
                        {editingIntent ? (
                          <div className="mt-2 flex items-start gap-2">
                            <textarea
                              autoFocus
                              value={editIntent}
                              onChange={(e) => setEditIntent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setEditIntent(selected.intent || "");
                                  setEditingIntent(false);
                                }
                              }}
                              rows={2}
                              className="min-w-0 flex-1 resize-y rounded-lg border border-white/15 bg-[#121212] px-2.5 py-1.5 text-[13px] text-[#FFFFFF] outline-none focus:border-[#FF6B00]/40"
                              placeholder="Short description"
                            />
                            <div className="flex flex-col gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => void commitIntent()}
                                className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                title="Save"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditIntent(selected.intent || "");
                                  setEditingIntent(false);
                                }}
                                className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-[#B3B3B3] hover:text-white"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingIntent(true)}
                            className="group mt-1 flex w-full items-start gap-2 text-left"
                          >
                            <p className="min-w-0 flex-1 text-[13px] text-[#B3B3B3] line-clamp-2">
                              {selected.intent || "Add a short description…"}
                            </p>
                            <Pencil
                              size={12}
                              className="mt-0.5 shrink-0 text-white/20 opacity-0 group-hover:opacity-100 transition"
                            />
                          </button>
                        )}

                        {/* Links — X + website only */}
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[11px] font-medium text-[#B3B3B3]">Links</p>
                          <input
                            value={links.x || ""}
                            onChange={(e) =>
                              setLinks((l) => ({ ...l, x: e.target.value }))
                            }
                            onBlur={() => void commitLinks()}
                            placeholder="X / Twitter — @handle or URL"
                            className="w-full rounded-xl bg-[#242424] px-3 py-2 text-[13px] text-[#FFFFFF] placeholder:text-[#6A6A6A] outline-none focus:ring-1 focus:ring-white/10"
                          />
                          <input
                            value={links.website || ""}
                            onChange={(e) =>
                              setLinks((l) => ({ ...l, website: e.target.value }))
                            }
                            onBlur={() => void commitLinks()}
                            placeholder="Website — https://…"
                            className="w-full rounded-xl bg-[#242424] px-3 py-2 text-[13px] text-[#FFFFFF] placeholder:text-[#6A6A6A] outline-none focus:ring-1 focus:ring-white/10"
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#B3B3B3]">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                          <span>{updates.length} milestones</span>
                          <Link
                            href={`/${handle}/${selected.slug}`}
                            className="inline-flex items-center gap-1 text-[#B3B3B3] hover:text-white transition"
                          >
                            Public page
                            <ExternalLink size={11} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project journey — timeline style */}
                  <div className="rounded-2xl bg-[#181818] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4">
                      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B3B3B3]">
                        Project journey
                      </h2>
                      {!showComposer && !viewingUpdateId && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingUpdateId(null);
                            setShowComposer(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B00] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#ff7a1a] transition"
                        >
                          <Plus size={14} strokeWidth={2.25} />
                          Add update
                        </button>
                      )}
                    </div>

                    {/* Composer — only when adding */}
                    {showComposer && (
                      <form
                        onSubmit={commit}
                        className="border-t border-white/[0.08] px-5 py-5 space-y-4 bg-[#121212]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium text-white/70">New update</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowComposer(false);
                              setHeadline("");
                              setWhy("");
                              staged.forEach((s) => URL.revokeObjectURL(s.preview));
                              setStaged([]);
                            }}
                            className="text-white/40 hover:text-white transition"
                            aria-label="Close composer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <label className="block">
                          <span className="text-[12px] font-medium text-white/50">Title</span>
                          <input
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            placeholder="e.g. Redesigned landing page."
                            autoFocus
                            className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#121212] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/20"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[12px] font-medium text-white/50">Note</span>
                          <textarea
                            value={why}
                            onChange={(e) => setWhy(e.target.value)}
                            required
                            rows={3}
                            placeholder="e.g. Onboarding drop-off at Step 2 was too high."
                            className="mt-1.5 w-full resize-y rounded-xl border border-white/[0.08] bg-[#121212] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/20"
                          />
                        </label>

                        <div>
                          <span className="text-[12px] font-medium text-white/50">
                            Visual proof
                          </span>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOver(false);
                              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                            }}
                            className={`mt-1.5 rounded-xl border border-dashed px-4 py-5 transition ${
                              dragOver
                                ? "border-[#FF6B00]/50 bg-[#FF6B00]/05"
                                : "border-white/15 bg-[#121212]"
                            }`}
                          >
                            {!staged.length ? (
                              <div className="text-center">
                                <Upload
                                  size={20}
                                  className="mx-auto text-white/30 mb-2"
                                  strokeWidth={1.5}
                                />
                                <p className="text-[13px] text-white/45">
                                  Drag & drop or click to upload
                                </p>
                                <label className="mt-2 inline-block cursor-pointer text-[12px] font-semibold text-[#FF6B00]">
                                  Choose files
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*,audio/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files && addFiles(e.target.files)
                                    }
                                  />
                                </label>
                              </div>
                            ) : (
                              <div>
                                {/* Compact swipe stage */}
                                <div className="relative">
                                  <div className="relative h-36 overflow-hidden rounded-xl bg-black/50">
                                    {activeStage?.file.type.startsWith("video/") ? (
                                      <video
                                        key={activeStage.id}
                                        src={activeStage.preview}
                                        controls
                                        className="h-full w-full object-contain"
                                      />
                                    ) : activeStage?.file.type.startsWith("image/") ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={activeStage.preview}
                                        alt=""
                                        className="h-full w-full object-contain"
                                      />
                                    ) : (
                                      <div className="grid h-full place-items-center text-[12px] text-white/40">
                                        {activeStage?.file.name}
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => activeStage && removeStaged(activeStage.id)}
                                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white/80 hover:text-white"
                                    >
                                      <X size={12} />
                                    </button>
                                    {staged.length > 1 && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setStageIndex((i) => Math.max(0, i - 1))
                                          }
                                          className="absolute left-1.5 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white/70"
                                        >
                                          ‹
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setStageIndex((i) =>
                                              Math.min(staged.length - 1, i + 1)
                                            )
                                          }
                                          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white/70"
                                        >
                                          ›
                                        </button>
                                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/70">
                                          {stageIndex + 1} / {staged.length}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                                    {staged.map((s, i) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setStageIndex(i)}
                                        className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ${
                                          i === stageIndex
                                            ? "ring-2 ring-[#FF6B00]"
                                            : "opacity-60 hover:opacity-100"
                                        }`}
                                      >
                                        {s.file.type.startsWith("image/") ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={s.preview}
                                            alt=""
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="grid h-full w-full place-items-center bg-white/5">
                                            <ImageIcon size={12} className="text-white/40" />
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                    <label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40">
                                      <Plus size={12} />
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,audio/*"
                                        className="hidden"
                                        onChange={(e) =>
                                          e.target.files && addFiles(e.target.files)
                                        }
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={busy || why.trim().length < 3}
                          className="w-full rounded-xl bg-[#FF6B00] py-3 text-[13px] font-semibold text-white hover:bg-[#ff7a1a] disabled:opacity-40 transition"
                        >
                          {busy ? "Saving…" : "Commit to Timeline →"}
                        </button>
                      </form>
                    )}

                    {/* Detail panel when an update is clicked */}
                    {viewingUpdateId && (() => {
                      const u = updates.find((x) => x.id === viewingUpdateId);
                      if (!u) return null;
                      return (
                        <div className="border-t border-white/[0.08] px-5 py-5 space-y-4 bg-[#242424]">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-[#FF6B00]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF6B00]">
                              {updateLabel(u.number)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingUpdateId(null)}
                              className="text-[#B3B3B3] hover:text-white transition"
                              aria-label="Close"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Media attached to this update */}
                          {u.mediaUrl ? (
                            <div className="relative group overflow-hidden rounded-xl bg-black/40">
                              {u.mediaKind === "video" ||
                              /\.(mp4|webm|mov)(\?|$)/i.test(u.mediaUrl) ? (
                                <video
                                  src={u.mediaUrl}
                                  controls
                                  className="max-h-40 w-full object-contain"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={u.mediaUrl}
                                  alt=""
                                  className="max-h-40 w-full object-contain"
                                />
                              )}
                              <p className="mt-1.5 text-[11px] text-[#B3B3B3]">
                                Media attached · replace/remove in a later pass when upload API is wired
                              </p>
                            </div>
                          ) : (
                            <p className="text-[12px] text-[#6A6A6A]">No media on this update</p>
                          )}

                          <div>
                            <label className="block text-[11px] font-medium text-[#B3B3B3] mb-1">
                              Title
                            </label>
                            <div className="rounded-xl bg-[#242424] px-3.5 py-2.5 text-[14px] text-white">
                              {u.headline || "—"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-[#B3B3B3] mb-1">
                              Note
                            </label>
                            <div className="rounded-xl bg-[#242424] px-3.5 py-2.5 text-[14px] text-[#FFFFFF] whitespace-pre-wrap">
                              {u.why}
                            </div>
                          </div>
                          <p className="text-[11px] text-[#B3B3B3]">
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Journey timeline list */}
                    {!viewingUpdateId && (
                      <div className="px-3 pb-4">
                        {chronological.length === 0 && !showComposer && (
                          <div className="px-2 py-12 text-center">
                            <p className="text-[13px] text-[#B3B3B3]">No milestones yet.</p>
                            <button
                              type="button"
                              onClick={() => setShowComposer(true)}
                              className="mt-3 text-[13px] font-medium text-[#FF6B00] hover:underline"
                            >
                              Add the first update
                            </button>
                          </div>
                        )}
                        {chronological.length > 0 && (
                          <ol className="relative">
                            <div
                              className="pointer-events-none absolute left-[18px] top-3 bottom-3 w-px bg-white/[0.08]"
                              aria-hidden
                            />
                            {[...chronological].reverse().map((u) => (
                              <li key={u.id} className="mb-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowComposer(false);
                                    setViewingUpdateId(u.id);
                                  }}
                                  className="relative flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-[#242424]"
                                >
                                  <span className="relative z-[1] mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B00] ring-4 ring-[#FF6B00]/20" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[12px] font-semibold text-[#FF6B00]">
                                      {updateLabel(u.number)}
                                    </span>
                                    <span className="mt-0.5 block text-[13px] text-[#FFFFFF] leading-snug line-clamp-2">
                                      {u.headline || "Untitled"}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </div>
                  </div>

                  {/* Right: live public preview at mobile width (not a phone mock) */}
                  <div className="lg:sticky lg:top-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={publicUrl}
                        className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#242424] px-3 py-2 text-[12px] text-[#B3B3B3] outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(publicUrl);
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="shrink-0 rounded-xl bg-[#2A2A2A] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#333] transition"
                      >
                        {linkCopied ? "Copied" : "Copy link"}
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181818]">
                      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                        <span className="text-[11px] font-medium text-[#B3B3B3]">
                          Preview
                        </span>
                        <span className="text-[10px] text-[#6A6A6A]">~390px</span>
                      </div>
                      <div className="mx-auto w-full max-w-[390px]">
                        <div className="relative h-[min(70vh,620px)] overflow-hidden bg-[#121212]">
                          <iframe
                            key={
                              selected.id +
                              String(updates.length) +
                              (viewingUpdateId
                                ? updates.find((u) => u.id === viewingUpdateId)
                                    ?.number || ""
                                : "")
                            }
                            src={
                              viewingUpdateId
                                ? `/${handle}/${selected.slug}?u=${
                                    updates.find((u) => u.id === viewingUpdateId)
                                      ?.number || ""
                                  }`
                                : `/${handle}/${selected.slug}`
                            }
                            title="Preview"
                            className="absolute inset-0 h-full w-full border-0 bg-[#121212]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loadingProjects && !selected && projects.length === 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-[#181818] py-16 text-center">
                  <p className="text-[14px] text-white/45">No projects yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle("");
                      setShowNew(true);
                    }}
                    className="mt-4 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[#121212]"
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showNew && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setShowNew(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#181818] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 id="new-project-title" className="text-[17px] font-semibold text-white">
                New project
              </h2>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowNew(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[13px] text-white/40 mb-5">
              Create a ledger for what you&apos;re building.
            </p>
            <form onSubmit={createProject} className="space-y-4">
              <label className="block">
                <span className="text-[12px] font-medium text-white/50">Project name</span>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Orbit Mesh"
                  autoFocus
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#121212] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-white/20"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={busy || !newTitle.trim()}
                  className="flex-1 rounded-xl bg-[#FF6B00] py-2.5 text-[13px] font-semibold text-white hover:bg-[#ff7a1a] disabled:opacity-40 transition"
                >
                  {busy ? "Creating…" : "Create project"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setShowNew(false);
                    setNewTitle("");
                  }}
                  className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/[0.04] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
