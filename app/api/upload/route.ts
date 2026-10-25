import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasNeonStorage, uploadBuffer } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  if (!hasNeonStorage()) {
    return NextResponse.json(
      {
        error:
          "File storage is not configured yet. You can still publish text updates.",
      },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is too large. Please keep media under 12 MB." },
      { status: 400 }
    );
  }

  const contentType = file.type || "application/octet-stream";
  if (
    !contentType.startsWith("image/") &&
    !contentType.startsWith("video/") &&
    !contentType.startsWith("audio/")
  ) {
    return NextResponse.json(
      { error: "Please upload an image, video, or audio file." },
      { status: 400 }
    );
  }

  const filename =
    typeof (file as File).name === "string" ? (file as File).name : undefined;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url, key } = await uploadBuffer({
      body: buffer,
      contentType,
      filename,
      folder: `users/${user.id}`,
    });
    const mediaKind = contentType.startsWith("video/")
      ? "video"
      : contentType.startsWith("audio/")
        ? "audio"
        : "image";
    return NextResponse.json({ url, key, mediaKind });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json(
      { error: "Could not upload that file. Please try again." },
      { status: 500 }
    );
  }
}
