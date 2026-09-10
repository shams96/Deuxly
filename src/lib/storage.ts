/**
 * Private object storage for user photos.
 *
 * Backends: Cloudflare R2 (S3 API) when configured, otherwise a local
 * `.data/uploads` directory that lives OUTSIDE `public/` — photos are never
 * web-served directly. Bytes only ever reach a client through
 * `GET /api/photos/[id]/file`, which checks session + ownership first.
 *
 * Storage keys are server-generated (`photos/<userId>/<uuid>.<ext>`); no
 * user-supplied filename is ever used, so there is no path-traversal surface.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";

const R2_ENABLED = Boolean(
  process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME,
);

export const storageBackend: "r2" | "local" = R2_ENABLED ? "r2" : "local";

const LOCAL_ROOT = join(process.cwd(), ".data", "uploads");

let s3Client: import("@aws-sdk/client-s3").S3Client | null = null;

async function getS3() {
  if (!s3Client) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    s3Client = new S3Client({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Build a server-controlled storage key. `kind` separates originals/thumbs. */
export function makeKey(userId: string, contentType: string, kind: "orig" | "thumb"): string {
  const ext = EXT[contentType] ?? "bin";
  return `photos/${userId}/${crypto.randomUUID()}-${kind}.${ext}`;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  if (storageBackend === "r2") {
    const client = await getS3();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }
  const path = join(LOCAL_ROOT, key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

export async function getObject(key: string): Promise<Buffer | null> {
  if (storageBackend === "r2") {
    try {
      const client = await getS3();
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const res = await client.send(
        new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }
  try {
    return await readFile(join(LOCAL_ROOT, key));
  } catch {
    return null;
  }
}

export async function deleteObjects(keys: string[]): Promise<void> {
  const real = keys.filter(Boolean);
  if (real.length === 0) return;
  if (storageBackend === "r2") {
    const client = await getS3();
    const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
    await client
      .send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Delete: { Objects: real.map((Key) => ({ Key })) },
        }),
      )
      .catch(() => {});
    return;
  }
  await Promise.all(
    real.map((k) => rm(join(LOCAL_ROOT, k), { force: true }).catch(() => {})),
  );
}
