import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = (searchParams.get("title") || "Wippo project").slice(0, 60);
  const handle = (searchParams.get("handle") || "builder").slice(0, 32);
  const milestones = searchParams.get("milestones") || "0";
  const u1 = (searchParams.get("u1") || "").slice(0, 48);
  const u2 = (searchParams.get("u2") || "").slice(0, 48);
  const u3 = (searchParams.get("u3") || "").slice(0, 48);
  const updates = [u1, u2, u3].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1218",
          color: "#fff",
          padding: "48px 56px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
            <div style={{ marginTop: 12, fontSize: 24, color: "#9ca3af" }}>By @{handle}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                fontSize: 18,
                padding: "8px 16px",
                borderRadius: 999,
              }}
            >
              ● Building in Public
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#d1d5db",
                fontSize: 18,
                padding: "8px 16px",
                borderRadius: 999,
              }}
            >
              {milestones} milestones
            </div>
          </div>
        </div>

        {updates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 2,
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              Latest updates
            </div>
            {updates.map((line, i) => (
              <div key={i} style={{ fontSize: 26, color: "#e5e7eb" }}>
                {line}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 24,
            marginTop: 24,
          }}
        >
          <div style={{ fontSize: 22, color: "#9ca3af" }}>
            wippo.online/{handle}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#FF6B00" }}>Wippo</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
