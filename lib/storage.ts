import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export function hasNeonStorage() {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET
  );
}

function s3() {
  return new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export function publicObjectUrl(key: string) {
  const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || "").replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET!;
  return `${endpoint}/${bucket}/${key}`;
}

/** Server-side upload of a buffer to Neon Object Storage. Returns public URL. */
export async function uploadBuffer(opts: {
  body: Buffer | Uint8Array;
  contentType: string;
  folder?: string;
  filename?: string;
}) {
  if (!hasNeonStorage()) {
    throw new Error("Neon Object Storage is not configured.");
  }
  const ext =
    opts.filename?.split(".").pop()?.toLowerCase() ||
    opts.contentType.split("/")[1]?.split(";")[0] ||
    "bin";
  const key = `${opts.folder || "media"}/${randomUUID()}.${ext}`;
  const client = s3();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: opts.body,
      ContentType: opts.contentType,
    })
  );
  return { key, url: publicObjectUrl(key) };
}

/** Presigned PUT URL for direct browser upload (optional). */
export async function presignUpload(opts: {
  contentType: string;
  filename?: string;
  folder?: string;
  expiresIn?: number;
}) {
  if (!hasNeonStorage()) {
    throw new Error("Neon Object Storage is not configured.");
  }
  const ext =
    opts.filename?.split(".").pop()?.toLowerCase() ||
    opts.contentType.split("/")[1]?.split(";")[0] ||
    "bin";
  const key = `${opts.folder || "media"}/${randomUUID()}.${ext}`;
  const client = s3();
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: opts.contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: opts.expiresIn ?? 300,
  });
  return { key, uploadUrl, publicUrl: publicObjectUrl(key) };
}
