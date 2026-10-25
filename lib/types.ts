export type SessionUser = {
  id: string;
  handle: string;
  email: string;
  displayName?: string | null;
};

export type ProjectLinks = {
  x?: string;
  website?: string;
  other?: string;
};

export type ProjectDTO = {
  id: string;
  title: string;
  slug: string;
  intent: string;
  handle: string;
  createdAt: string;
  updateCount: number;
  links?: ProjectLinks;
};

export type UpdateDTO = {
  id: string;
  number: number;
  headline: string;
  why: string;
  mediaUrl?: string | null;
  mediaKind?: string | null;
  createdAt: string;
};
