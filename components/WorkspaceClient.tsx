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
  MoreHorizontal,
  Trash2,
  Copy,
} from "lucide-react";
import { updateLabel } from "@/lib/slug";
import type { ProjectDTO, UpdateDTO } from "@/lib/types";

type StagedFile = {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "ready" | "error";
  progress: string;
  remoteUrl?: string;
  mediaKind?: string;
  error?: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 12 * 1024 * 1024; // 12 MB (server limit)
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type ProjectLinks = {
  x?: string;
  website?: string;
  other?: string;
};

export function WorkspaceClient({
  handle: initialHandle,
  email,
  displayName: initialDisplayName,
}: {
  handle: string;
  email: string;
  displayName: string;
}) {
  const [userHandle, setUserHandle] = useState(initialHandle);
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
  const [draftLinks, setDraftLinks] = useState<ProjectLinks>({});
  const [editingLinks, setEditingLinks] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [profileName, setProfileName] = useState(initialDisplayName);
  const [draftProfileName, setDraftProfileName] = useState(initialDisplayName);
  const [editingProfile, setEditingProfile] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [previewTick, setPreviewTick] = useState(0);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewingUpdateId, setViewingUpdateId] = useState<string | null>(null);
  const [updateMenuId, setUpdateMenuId] = useState<string | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<UpdateDTO | null>(null);
  const [editHeadline, setEditHeadline] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [deleteUpdateId, setDeleteUpdateId] = useState<string | null>(null);
  const [shareCard, setShareCard] = useState<null | {
    kind: "project" | "update";
    title: string;
    subtitle: string;
    url: string;
    imageUrl?: string | null;
    updates?: { headline: string; when: string }[];
  }>(null);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const publicUrl = useMemo(() => {
    if (!selected) return "";
    let origin =
      typeof window !== "undefined" ? window.location.origin : "";
    // Prefer apex host in shared links (no www.)
    try {
      const u = new URL(origin || "https://wippo.online");
      u.host = u.host.replace(/^www\./, "");
      origin = u.origin;
    } catch {
      /* keep */
    }
    return `${origin}/${userHandle}/${selected.slug}`;
  }, [selected, userHandle]);

  /** Display-only short link (no protocol) */
  const shortPublicUrl = useMemo(() => {
    if (!selected) return "";
    try {
      const u = new URL(publicUrl);
      const host = u.host.replace(/^www\./, "");
      return `${host}${u.pathname}`.replace(/\/$/, "");
    } catch {
      return `${userHandle}/${selected.slug}`;
    }
  }, [publicUrl, userHandle, selected]);

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
      setProjectImagePreview(selected.imageUrl || null);
      setEditingName(false);
      setEditingIntent(false);
      setLinks(selected.links || {});
      setDraftLinks(selected.links || {});
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
    setError("");
    const room = Math.max(0, 8 - staged.length);
    const batch = arr.slice(0, room);
    if (!batch.length) {
      setError("You can attach up to 8 files per update.");
      return;
    }

    const created: StagedFile[] = batch.map((file) => {
      const isVid = file.type.startsWith("video/");
      const isAud = file.type.startsWith("audio/");
      const limit = isVid ? MAX_VIDEO_BYTES : isAud ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
      const tooBig = file.size > limit;
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
        status: tooBig ? "error" : "uploading",
        progress: tooBig
          ? `Too large (${formatBytes(file.size)}). Max ${formatBytes(limit)}.`
          : "Uploading…",
        error: tooBig
          ? `File is ${formatBytes(file.size)}. Keep under ${formatBytes(limit)}.`
          : undefined,
      };
    });

    setStaged((prev) => {
      const merged = [...prev, ...created].slice(0, 8);
      setStageIndex(Math.max(0, merged.length - created.length));
      return merged;
    });

    // Upload each eligible file immediately
    for (const item of created) {
      if (item.status === "error") continue;
      void (async () => {
        try {
          const form = new FormData();
          form.append("file", item.file);
          const up = await fetch("/api/upload", { method: "POST", body: form });
          const upData = await up.json().catch(() => ({}));
          if (!up.ok || !upData.url) {
            const msg =
              upData.error ||
              (up.status === 503
                ? "Storage is not configured on the server."
                : "Upload failed. Try a smaller file.");
            setStaged((prev) =>
              prev.map((s) =>
                s.id === item.id
                  ? { ...s, status: "error", progress: msg, error: msg }
                  : s
              )
            );
            return;
          }
          setStaged((prev) =>
            prev.map((s) =>
              s.id === item.id
                ? {
                    ...s,
                    status: "ready",
                    progress: `Ready · ${formatBytes(item.file.size)}`,
                    remoteUrl: upData.url as string,
                    mediaKind: (upData.mediaKind as string) || undefined,
                  }
                : s
            )
          );
        } catch {
          setStaged((prev) =>
            prev.map((s) =>
              s.id === item.id
                ? {
                    ...s,
                    status: "error",
                    progress: "Upload failed. Check connection and try again.",
                    error: "Upload failed.",
                  }
                : s
            )
          );
        }
      })();
    }
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
    setSettingUp(true);
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
      setSettingUp(false);
    }
  };

  const persistProject = async (patch: {
    title?: string;
    intent?: string;
    links?: ProjectLinks;
    imageUrl?: string | null;
  }) => {
    if (!selectedId) return false;
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

      // Re-read from server so refresh matches what we show
      const verify = await fetch(`/api/projects/${selectedId}`);
      const verified = await verify.json();
      const proj = verified.project || data.project;
      if (proj) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedId
              ? {
                  ...p,
                  title: proj.title ?? p.title,
                  intent: proj.intent ?? p.intent,
                  slug: proj.slug ?? p.slug,
                  imageUrl: proj.imageUrl ?? null,
                  links: proj.links || undefined,
                }
              : p
          )
        );
        setProjectImagePreview(proj.imageUrl || null);
        setLinks(proj.links || {});
        setDraftLinks(proj.links || {});
      }
      setPreviewTick((n) => n + 1);
      setToast("Saved");
      setTimeout(() => setToast(""), 2000);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveProjectImage = async (file: File) => {
    if (!selectedId) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setSettingUp(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upData = await up.json().catch(() => ({}));
      let url: string | null = up.ok && upData.url ? String(upData.url) : null;
      if (!url) {
        if (up.status === 503) {
          throw new Error(
            "File storage is not configured on the server (AWS / Neon bucket). Logo cannot be saved until storage env vars are set."
          );
        }
        // small fallback only
        const dataUrl = await fileToDataUrl(file);
        if (dataUrl.length > 500_000) {
          throw new Error(
            "Image is too large without cloud storage. Configure Neon Object Storage on Vercel, or use a smaller image."
          );
        }
        url = dataUrl;
        setToast("Saved in database (storage upload failed).");
      }
      setProjectImagePreview(url);
      const ok = await persistProject({ imageUrl: url });
      if (!ok) throw new Error("Logo did not save. Try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save project image.");
    } finally {
      setSettingUp(false);
    }
  };

  const deleteProject = async () => {
    if (!selectedId || !selected) return;
    if (deleteConfirm !== selected.title) {
      setError("Type the project name exactly to confirm delete.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${selectedId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete project.");
      setProjects((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId(null);
      setDeleteConfirm("");
      setToast("Project deleted");
      setTimeout(() => setToast(""), 2000);
      setNav("projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project.");
    } finally {
      setBusy(false);
    }
  };

  const saveProfileName = async () => {
    const name = draftProfileName.trim();
    if (!name) {
      setError("Please enter a name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save name.");
      setProfileName(data.user?.displayName || name);
      if (data.user?.handle) setUserHandle(data.user.handle);
      setEditingProfile(false);
      setToast(
        data.user?.handle
          ? `Name updated · @${data.user.handle}`
          : "Name updated"
      );
      setPreviewTick((n) => n + 1);
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save name.");
    } finally {
      setBusy(false);
    }
  };

  const commitLinks = async () => {
    const ok = await persistProject({ links: draftLinks });
    if (ok) {
      setLinks(draftLinks);
      setEditingLinks(false);
    }
  };

  const cancelLinks = () => {
    setDraftLinks(links);
    setEditingLinks(false);
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
    const uploading = staged.some((s) => s.status === "uploading");
    if (uploading) {
      setError("Wait until media finishes uploading (green Ready).");
      return;
    }
    const failed = staged.filter((s) => s.status === "error");
    if (failed.length) {
      setError("Remove failed media or replace it before publishing.");
      return;
    }
    setBusy(true);
    setError("");
    setToast("");
    try {
      const ready = staged.filter((s) => s.status === "ready" && s.remoteUrl);
      const mediaUrls = ready.map((s) => s.remoteUrl!) ;
      const mediaKind = ready[0]?.mediaKind || (ready[0]?.file.type.startsWith("video/") ? "video" : ready[0]?.file.type.startsWith("audio/") ? "audio" : ready.length ? "image" : undefined);

      if (staged.length && !mediaUrls.length) {
        throw new Error("Media did not finish uploading. Remove it or try again.");
      }

      setToast(
        mediaUrls.length
          ? `Publishing with ${mediaUrls.length} file${mediaUrls.length > 1 ? "s" : ""}…`
          : "Publishing…"
      );

      const res = await fetch(`/api/projects/${selectedId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim() || undefined,
          why: why.trim(),
          mediaUrls: mediaUrls.length ? mediaUrls : undefined,
          mediaKind,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not publish. Please try again.");
      setHeadline("");
      setWhy("");
      staged.forEach((s) => URL.revokeObjectURL(s.preview));
      setStaged([]);
      setStageIndex(0);
      setShowComposer(false);
      await loadUpdates(selectedId);
      await loadProjects();
      setPreviewTick((n) => n + 1);
      setToast("Update published");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setToast("");
    } finally {
      setBusy(false);
    }
  };

  const openEditUpdate = (u: UpdateDTO) => {
    setUpdateMenuId(null);
    setEditingUpdate(u);
    setEditHeadline(u.headline || "");
    setEditWhy(u.why || "");
  };

  const saveEditUpdate = async () => {
    if (!selectedId || !editingUpdate) return;
    if (editWhy.trim().length < 3) {
      setError("Add a short note on why this matters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/projects/${selectedId}/updates/${editingUpdate.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline: editHeadline.trim() || "Update",
            why: editWhy.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save update.");
      setUpdates((prev) =>
        prev.map((u) => (u.id === editingUpdate.id ? { ...u, ...data.update } : u))
      );
      setEditingUpdate(null);
      setPreviewTick((n) => n + 1);
      setToast("Update saved");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save update.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteUpdate = async () => {
    if (!selectedId || !deleteUpdateId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/projects/${selectedId}/updates/${deleteUpdateId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete update.");
      setUpdates((prev) => prev.filter((u) => u.id !== deleteUpdateId));
      if (viewingUpdateId === deleteUpdateId) setViewingUpdateId(null);
      setDeleteUpdateId(null);
      setPreviewTick((n) => n + 1);
      setToast("Update deleted");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete update.");
    } finally {
      setBusy(false);
    }
  };

  const copyUpdateLink = async (u: UpdateDTO) => {
    setUpdateMenuId(null);
    if (!selected) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/${userHandle}/${selected.slug}?u=${u.number}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* still show card */
    }
    // Prefer this update's media; fall back to project logo
    let media: string | null | undefined = selected.imageUrl;
    if (u.mediaUrl) {
      const raw = u.mediaUrl.trim();
      if (raw.startsWith("[")) {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && typeof arr[0] === "string") media = arr[0];
        } catch {
          media = raw;
        }
      } else {
        media = raw;
      }
    }
    setShareCard({
      kind: "update",
      title: u.headline || updateLabel(u.number),
      subtitle: selected.title,
      url: link,
      imageUrl: media,
    });
  };

  const copyProjectLink = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
    const recent = [...updates]
      .sort((a, b) => b.number - a.number)
      .slice(0, 3)
      .map((u) => ({
        headline: u.headline || updateLabel(u.number),
        when: new Date(u.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
    setShareCard({
      kind: "project",
      title: selected.title,
      subtitle: `@${userHandle}`,
      url: publicUrl,
      imageUrl: selected.imageUrl || projectImagePreview,
      updates: recent,
    });
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
      {settingUp && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#181818] px-8 py-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wippo-icon.png"
              alt=""
              className="h-10 w-10 object-contain animate-pulse"
            />
            <p className="text-[14px] font-medium text-white">Setting up your project…</p>
          </div>
        </div>
      )}
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

          {!loadingProjects && nav === "settings" && (
            <div className="mx-auto max-w-lg space-y-6">
              <h1 className="text-[18px] font-semibold">Settings</h1>
              {error && (
                <p className="text-[13px] text-red-400" role="alert">{error}</p>
              )}
              {toast && (
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-300">
                  {toast}
                </p>
              )}
              <div className="rounded-2xl border border-white/[0.08] bg-[#181818] p-5 space-y-4">
                <p className="text-[12px] text-[#B3B3B3]">Display name</p>
                {editingProfile ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={draftProfileName}
                      onChange={(e) => setDraftProfileName(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#121212] px-3 py-2 text-[15px] text-white outline-none focus:border-[#FF6B00]/40"
                    />
                    <button
                      type="button"
                      onClick={() => void saveProfileName()}
                      className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftProfileName(profileName);
                        setEditingProfile(false);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-[#B3B3B3]"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftProfileName(profileName);
                      setEditingProfile(true);
                    }}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-[15px] font-medium">{profileName}</span>
                    <Pencil size={14} className="text-white/30" />
                  </button>
                )}
                <div className="pt-2 border-t border-white/[0.06] space-y-1 text-[13px] text-[#B3B3B3]">
                  <p>Handle: @{userHandle}</p>
                  <p>Email: {email}</p>
                </div>
              </div>

              {selected && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
                  <h2 className="text-[14px] font-semibold text-red-300">Delete project</h2>
                  <p className="text-[13px] text-[#B3B3B3] leading-relaxed">
                    This permanently deletes <span className="text-white font-medium">{selected.title}</span>,
                    all of its updates, and follower emails. This cannot be undone.
                  </p>
                  <label className="block text-[12px] text-[#B3B3B3]">
                    Type <span className="text-white font-medium">{selected.title}</span> to confirm
                    <input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-red-500/30 bg-[#121212] px-3 py-2 text-[14px] text-white outline-none"
                      placeholder={selected.title}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || deleteConfirm !== selected.title}
                    onClick={() => void deleteProject()}
                    className="rounded-full bg-red-500/90 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40 hover:bg-red-500"
                  >
                    Delete forever
                  </button>
                </div>
              )}
              {!selected && (
                <p className="text-[13px] text-[#6A6A6A]">
                  Select a project under Projects to delete it from here.
                </p>
              )}
            </div>
          )}

          {!loadingProjects && nav === "help" && (
            <div className="mx-auto max-w-lg space-y-6">
              <h1 className="text-[18px] font-semibold">Help</h1>
              <ol className="space-y-4">
                {[
                  {
                    t: "Create a project",
                    b: "Open Projects, create a project, give it a clear title.",
                  },
                  {
                    t: "Add a description and logo",
                    b: "Click the title or description to edit. Click the circle image to upload a logo. Use the check mark to save, X to cancel.",
                  },
                  {
                    t: "Add links",
                    b: "Click the pencil next to Links, enter X and website, then the green check to save.",
                  },
                  {
                    t: "Publish updates",
                    b: "Use Add update. Write a short note (and optional media), then publish. Each update is numbered on your public page.",
                  },
                  {
                    t: "Share your link",
                    b: "Copy the short link above the preview. Anyone can open it without an account.",
                  },
                ].map((s, i) => (
                  <li
                    key={s.t}
                    className="rounded-2xl border border-white/[0.08] bg-[#181818] p-4 flex gap-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FF6B00] text-[12px] font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold">{s.t}</p>
                      <p className="mt-1 text-[13px] text-[#B3B3B3] leading-relaxed">{s.b}</p>
                    </div>
                  </li>
                ))}
              </ol>
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
                                {p.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.imageUrl}
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
                                    /{userHandle}/{p.slug}
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
                            e.target.value = "";
                            if (f) void saveProjectImage(f);
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

                        {/* Links — edit with save / cancel */}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-medium text-[#B3B3B3]">Links</p>
                            {editingLinks ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void commitLinks()}
                                  className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                  title="Save"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelLinks}
                                  className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-[#B3B3B3] hover:text-white"
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftLinks(links);
                                  setEditingLinks(true);
                                }}
                                className="grid h-7 w-7 place-items-center rounded-full text-white/30 hover:text-white hover:bg-white/[0.06]"
                                title="Edit links"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                          {editingLinks ? (
                            <>
                              <input
                                value={draftLinks.x || ""}
                                onChange={(e) =>
                                  setDraftLinks((l) => ({ ...l, x: e.target.value }))
                                }
                                placeholder="X / Twitter — @handle or URL"
                                className="w-full rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-[13px] text-white placeholder:text-[#6A6A6A] outline-none focus:border-[#FF6B00]/40"
                              />
                              <input
                                value={draftLinks.website || ""}
                                onChange={(e) =>
                                  setDraftLinks((l) => ({
                                    ...l,
                                    website: e.target.value,
                                  }))
                                }
                                placeholder="Website — https://…"
                                className="w-full rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-[13px] text-white placeholder:text-[#6A6A6A] outline-none focus:border-[#FF6B00]/40"
                              />
                            </>
                          ) : (
                            <div className="space-y-1 text-[13px] text-[#B3B3B3]">
                              {links.x || links.website ? (
                                <>
                                  {links.x && (
                                    <p className="truncate">X · {links.x}</p>
                                  )}
                                  {links.website && (
                                    <p className="truncate">Web · {links.website}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-[#6A6A6A]">Add X or website…</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#B3B3B3]">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                          <span>{updates.length} milestones</span>
                          <Link
                            href={`/${userHandle}/${selected.slug}`}
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
                  <div className="rounded-2xl bg-[#181818] overflow-visible">
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
                              <div className="text-center py-2">
                                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/[0.04] border border-white/[0.08]">
                                  <Upload
                                    size={18}
                                    className="text-white/40"
                                    strokeWidth={1.5}
                                  />
                                </div>
                                <p className="text-[13px] text-white/55">
                                  Add screenshots or a short clip
                                </p>
                                <p className="mt-1 text-[11px] text-white/30">
                                  Images ≤ 5 MB · Videos ≤ 12 MB · max 8
                                </p>
                                <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#FF6B00]/15 px-3.5 py-1.5 text-[12px] font-semibold text-[#FF6B00] hover:bg-[#FF6B00]/25 transition">
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
                                  <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-transparent">
                                    {activeStage?.file.type.startsWith("video/") ? (
                                      <video
                                        key={activeStage.id}
                                        src={activeStage.preview}
                                        controls
                                        className="w-full max-h-72 rounded-xl bg-black object-contain"
                                      />
                                    ) : activeStage?.file.type.startsWith("image/") ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={activeStage.preview}
                                        alt=""
                                        className="block w-full h-auto max-h-80 object-contain rounded-xl"
                                      />
                                    ) : (
                                      <div className="grid min-h-[6rem] place-items-center text-[12px] text-white/40 py-8">
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
                                    {activeStage && (
                                      <div
                                        className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                          activeStage.status === "ready"
                                            ? "bg-emerald-500/90 text-white"
                                            : activeStage.status === "uploading"
                                              ? "bg-amber-500/90 text-black"
                                              : "bg-red-500/90 text-white"
                                        }`}
                                      >
                                        {activeStage.status === "ready"
                                          ? "Ready"
                                          : activeStage.status === "uploading"
                                            ? "Uploading…"
                                            : "Failed"}
                                      </div>
                                    )}
                                  </div>
                                  {activeStage && (
                                    <p
                                      className={`mt-1.5 text-[11px] ${
                                        activeStage.status === "ready"
                                          ? "text-emerald-400"
                                          : activeStage.status === "uploading"
                                            ? "text-amber-300"
                                            : "text-red-400"
                                      }`}
                                    >
                                      {activeStage.file.name} · {activeStage.progress}
                                    </p>
                                  )}
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
                                Media on this update
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
                              <li key={u.id} className="mb-0.5 relative">
                                <div className="relative flex w-full items-start gap-1 rounded-xl px-1 py-1 hover:bg-[#242424]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowComposer(false);
                                      setViewingUpdateId(u.id);
                                      setUpdateMenuId(null);
                                    }}
                                    className="relative flex min-w-0 flex-1 gap-3 rounded-xl px-2.5 py-2.5 text-left"
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
                                  <div className="relative shrink-0 pr-1 pt-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUpdateMenuId((id) =>
                                          id === u.id ? null : u.id
                                        );
                                      }}
                                      className="grid h-8 w-8 place-items-center rounded-full text-white/30 hover:bg-white/[0.08] hover:text-white"
                                      title="Update menu"
                                    >
                                      <MoreHorizontal size={16} />
                                    </button>
                                    {updateMenuId === u.id && (
                                      <div className="absolute right-0 bottom-full mb-1 z-[100] min-w-[168px] rounded-xl border border-white/10 bg-[#1c1c1c] py-1.5 shadow-2xl">
                                        <button
                                          type="button"
                                          onClick={() => openEditUpdate(u)}
                                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-white hover:bg-white/[0.06]"
                                        >
                                          <Pencil size={14} className="text-white/40" />
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void copyUpdateLink(u)}
                                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-white hover:bg-white/[0.06]"
                                        >
                                          <Copy size={14} className="text-white/40" />
                                          Copy link
                                        </button>
                                        <div className="my-1 h-px bg-white/[0.06]" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setUpdateMenuId(null);
                                            setDeleteUpdateId(u.id);
                                          }}
                                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-300 hover:bg-red-500/10"
                                        >
                                          <Trash2 size={14} />
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
                        value={shortPublicUrl}
                        className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#242424] px-3 py-2 text-[12px] text-[#B3B3B3] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void copyProjectLink()}
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
                              "-" +
                              previewTick +
                              "-" +
                              String(updates.length) +
                              (viewingUpdateId
                                ? "-" +
                                  (updates.find((u) => u.id === viewingUpdateId)
                                    ?.number || "")
                                : "")
                            }
                            src={
                              viewingUpdateId
                                ? `/${userHandle}/${selected.slug}?u=${
                                    updates.find((u) => u.id === viewingUpdateId)
                                      ?.number || ""
                                  }`
                                : `/${userHandle}/${selected.slug}`
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


      {/* Share card — dark, roomy, same for project & update */}
      {shareCard && (
        <div
          className="fixed inset-0 z-[95] grid place-items-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={() => setShareCard(null)}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShareCard(null)}
              className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#242424] text-white/70 hover:text-white border border-white/10"
              aria-label="Close"
            >
              <X size={15} />
            </button>
            <p className="mb-4 text-center text-[13px] text-emerald-400">
              Link copied
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#181818] shadow-2xl flex flex-col sm:flex-row min-h-[200px]">
              {/* Left visual */}
              <div className="relative sm:w-[44%] min-h-[180px] bg-[#121212] shrink-0 flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-white/[0.06]">
                {shareCard.kind === "project" ? (
                  shareCard.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shareCard.imageUrl}
                      alt=""
                      className="h-28 w-28 rounded-full object-cover ring-2 ring-white/10 shadow-xl"
                    />
                  ) : (
                    <div className="grid h-28 w-28 place-items-center rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-[36px] font-bold ring-2 ring-white/10">
                      {shareCard.title.slice(0, 1).toUpperCase()}
                    </div>
                  )
                ) : shareCard.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shareCard.imageUrl}
                    alt=""
                    className="max-h-[150px] max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/wippo-icon.png"
                      alt=""
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                )}
              </div>
              {/* Right info */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/wippo-icon.png"
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-[12px] font-semibold text-white/50">
                      Wippo
                    </span>
                  </div>
                  <h3 className="text-[20px] font-semibold leading-snug tracking-tight line-clamp-2">
                    {shareCard.title}
                  </h3>
                  <p className="mt-2 text-[14px] text-white/50 line-clamp-2">
                    {shareCard.kind === "project"
                      ? `Follow ${shareCard.subtitle} building in public`
                      : `Update on ${shareCard.subtitle}`}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-[12px] text-white/35 truncate min-w-0">
                    {shareCard.url
                      .replace(/^https?:\/\//, "")
                      .replace(/^www\./, "")}
                  </p>
                  <span className="shrink-0 rounded-full bg-[#FF6B00] px-4 py-2 text-[12px] font-bold text-white">
                    Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit update modal */}
      {editingUpdate && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181818] p-5 shadow-2xl">
            <h3 className="text-[15px] font-semibold">Edit update</h3>
            <label className="mt-4 block text-[12px] text-[#B3B3B3]">
              Title
              <input
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121212] px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#FF6B00]/40"
              />
            </label>
            <label className="mt-3 block text-[12px] text-[#B3B3B3]">
              Note
              <textarea
                value={editWhy}
                onChange={(e) => setEditWhy(e.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#121212] px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#FF6B00]/40"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUpdate(null)}
                className="rounded-full px-4 py-2 text-[13px] text-[#B3B3B3] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveEditUpdate()}
                className="rounded-full bg-[#FF6B00] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete update confirm */}
      {deleteUpdateId && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#181818] p-5 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-red-300">Delete this update?</h3>
            <p className="mt-2 text-[13px] text-[#B3B3B3] leading-relaxed">
              This permanently removes the update from your project and public page. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteUpdateId(null)}
                className="rounded-full px-4 py-2 text-[13px] text-[#B3B3B3] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDeleteUpdate()}
                className="rounded-full bg-red-500/90 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}