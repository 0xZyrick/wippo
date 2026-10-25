export function slugify(title: string): string {
  return (
    String(title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "project"
  );
}

export function updateLabel(n: number): string {
  return `Update ${Math.max(1, Math.floor(n))}`;
}

export function parseUpdateParam(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = String(value).trim().match(/^(?:u|update)?\s*(\d+)$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}
