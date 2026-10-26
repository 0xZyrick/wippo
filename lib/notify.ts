/**
 * Notify project email followers when a new update is published.
 * Uses Resend if RESEND_API_KEY is set; otherwise no-ops (followers still stored).
 */
export async function notifyFollowersOfUpdate(opts: {
  emails: string[];
  projectTitle: string;
  handle: string;
  slug: string;
  headline: string;
  number: number;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.emails.length) return { sent: 0 };

  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://www.wippo.online"
  ).replace(/\/$/, "");
  const url = `${origin}/${opts.handle}/${opts.slug}?u=${opts.number}`;
  const from =
    process.env.RESEND_FROM || "Wippo <onboarding@resend.dev>";

  let sent = 0;
  for (const to of opts.emails) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `${opts.projectTitle} posted a new update`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#121212;color:#f5f5f5;border-radius:12px">
              <p style="margin:0 0 8px;color:#b3b3b3;font-size:13px">Wippo · build update</p>
              <h1 style="margin:0 0 12px;font-size:20px;color:#fff">${escapeHtml(opts.projectTitle)}</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#d0d0d0">
                <strong style="color:#FF6B00">Update ${opts.number}</strong> — ${escapeHtml(opts.headline)}
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#b3b3b3">
                They just logged progress on their public timeline. Take a look.
              </p>
              <a href="${url}" style="display:inline-block;background:#FF6B00;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px">
                View update
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#6a6a6a">${url}</p>
            </div>
          `,
        }),
      });
      if (res.ok) sent += 1;
    } catch {
      /* continue */
    }
  }
  return { sent };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
