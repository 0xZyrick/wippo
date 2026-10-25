/**
 * In-memory store when DATABASE_URL is unset — local demo only.
 */
import { slugify } from "./slug";
import type { SessionUser, ProjectDTO, UpdateDTO } from "./types";

type UserRow = SessionUser & { email: string };
type ProjectLinks = {
  x?: string;
  website?: string;
  other?: string;
};
type ProjectRow = {
  id: string;
  creatorId: string;
  title: string;
  slug: string;
  intent: string;
  links?: ProjectLinks;
  createdAt: string;
};
type UpdateRow = UpdateDTO & { projectId: string };
type Otp = { email: string; code: string; expiresAt: number };

const g = globalThis as unknown as {
  wippoMem?: {
    users: UserRow[];
    projects: ProjectRow[];
    updates: UpdateRow[];
    otps: Otp[];
    subscribers: { projectId: string; email: string }[];
    sessions: Map<string, string>; // token -> userId
  };
};

function mem() {
  if (!g.wippoMem) {
    const uid = "user_demo";
    g.wippoMem = {
      users: [
        {
          id: uid,
          handle: "alex",
          email: "alex@example.com",
          displayName: "Alex",
        },
      ],
      projects: [
        {
          id: "proj_orbit",
          creatorId: uid,
          title: "Orbit Mesh",
          slug: "orbit-mesh",
          intent: "A spatial collaboration layer for remote builders.",
          createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        },
      ],
      updates: [
        {
          id: "u1",
          projectId: "proj_orbit",
          number: 1,
          headline: "The raw pitch",
          why: "Named the problem and recorded the first note of intent.",
          createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        },
        {
          id: "u2",
          projectId: "proj_orbit",
          number: 2,
          headline: "Schema locked",
          why: "Every update is sequential and tied to the project object.",
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        },
        {
          id: "u3",
          projectId: "proj_orbit",
          number: 3,
          headline: "Public ledger page",
          why: "Visitors time-travel the history without a social feed.",
          createdAt: new Date().toISOString(),
        },
      ],
      otps: [],
      subscribers: [],
      sessions: new Map(),
    };
  }
  return g.wippoMem;
}

export const memory = {
  listProjectsForUser(userId: string): ProjectDTO[] {
    const m = mem();
    return m.projects
      .filter((p) => p.creatorId === userId)
      .map((p) => {
        const user = m.users.find((u) => u.id === p.creatorId)!;
        const updateCount = m.updates.filter((u) => u.projectId === p.id).length;
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          intent: p.intent,
          handle: user.handle,
          createdAt: p.createdAt,
          updateCount,
          links: p.links,
        };
      });
  },
  getProjectById(id: string) {
    const m = mem();
    const p = m.projects.find((x) => x.id === id);
    if (!p) return null;
    const user = m.users.find((u) => u.id === p.creatorId)!;
    return { project: p, handle: user.handle };
  },
  getProjectByHandleSlug(handle: string, slug: string) {
    const m = mem();
    const user = m.users.find((u) => u.handle.toLowerCase() === handle.toLowerCase());
    if (!user) return null;
    const p = m.projects.find(
      (x) => x.creatorId === user.id && (x.slug === slug || slugify(x.title) === slug)
    );
    if (!p) return null;
    return { project: p, handle: user.handle };
  },
  listUpdates(projectId: string): UpdateDTO[] {
    return mem()
      .updates.filter((u) => u.projectId === projectId)
      .sort((a, b) => a.number - b.number)
      .map(({ projectId: _p, ...rest }) => rest);
  },
  createProject(userId: string, title: string, intent: string) {
    const m = mem();
    const id = `proj_${Math.random().toString(36).slice(2, 10)}`;
    const row = {
      id,
      creatorId: userId,
      title: title.trim(),
      slug: slugify(title),
      intent: intent.trim(),
      createdAt: new Date().toISOString(),
    };
    m.projects.unshift(row);
    return row;
  },
  updateProject(
    projectId: string,
    userId: string,
    data: { title?: string; intent?: string; links?: ProjectLinks }
  ) {
    const m = mem();
    const p = m.projects.find((x) => x.id === projectId && x.creatorId === userId);
    if (!p) return null;
    if (typeof data.title === "string" && data.title.trim()) {
      p.title = data.title.trim();
      // keep existing slug stable for public links
    }
    if (typeof data.intent === "string") {
      p.intent = data.intent.trim();
    }
    if (data.links) {
      p.links = {
        x: data.links.x?.trim() || undefined,
        website: data.links.website?.trim() || undefined,
        other: data.links.other?.trim() || undefined,
      };
    }
    return p;
  },
  commitUpdate(
    projectId: string,
    data: { headline: string; why: string; mediaUrl?: string; mediaKind?: string }
  ) {
    const m = mem();
    const existing = m.updates.filter((u) => u.projectId === projectId);
    const number = existing.length ? Math.max(...existing.map((u) => u.number)) + 1 : 1;
    const row: UpdateRow = {
      id: `upd_${Math.random().toString(36).slice(2, 10)}`,
      projectId,
      number,
      headline: data.headline,
      why: data.why,
      mediaUrl: data.mediaUrl,
      mediaKind: data.mediaKind,
      createdAt: new Date().toISOString(),
    };
    m.updates.push(row);
    return row;
  },
  requestOtp(email: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    mem().otps = mem().otps.filter((o) => o.email !== email);
    mem().otps.push({ email, code, expiresAt: Date.now() + 10 * 60 * 1000 });
    return code; // returned for demo; production would email it
  },
  verifyOtp(email: string, code: string): UserRow | null {
    const m = mem();
    const otp = m.otps.find((o) => o.email === email && o.code === code && o.expiresAt > Date.now());
    if (!otp) return null;
    m.otps = m.otps.filter((o) => o.email !== email);
    let user = m.users.find((u) => u.email === email);
    if (!user) {
      const handle =
        email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24) || "builder";
      let unique = handle;
      let i = 1;
      while (m.users.some((u) => u.handle === unique)) {
        unique = `${handle}${i++}`;
      }
      user = {
        id: `user_${Math.random().toString(36).slice(2, 10)}`,
        handle: unique,
        email,
        displayName: unique,
      };
      m.users.push(user);
    }
    return user;
  },
  createSession(userId: string) {
    const token = `sess_${Math.random().toString(36).slice(2)}`;
    mem().sessions.set(token, userId);
    return token;
  },
  userFromSession(token: string | undefined | null): UserRow | null {
    if (!token) return null;
    const uid = mem().sessions.get(token);
    if (!uid) return null;
    return mem().users.find((u) => u.id === uid) || null;
  },
  clearSession(token: string) {
    mem().sessions.delete(token);
  },
  subscribe(projectId: string, email: string) {
    const m = mem();
    if (!m.subscribers.some((s) => s.projectId === projectId && s.email === email)) {
      m.subscribers.push({ projectId, email });
    }
  },
};
