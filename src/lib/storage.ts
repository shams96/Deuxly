import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const R2_ENABLED =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY;

let s3Client: import("@aws-sdk/client-s3").S3Client | null = null;

async function getS3Client() {
  if (!s3Client && R2_ENABLED) {
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

export async function uploadToStorage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (R2_ENABLED) {
    const client = await getS3Client();
    if (!client) throw new Error("S3 client not initialized");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const bucket = process.env.R2_BUCKET_NAME ?? "deuxly-photos";
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const publicBase = process.env.R2_PUBLIC_URL;
    if (publicBase) return `${publicBase}/${key}`;
    return key;
  }

  const uploadsDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const relativePath = key.replace(/^uploads\//, "");
  const absolutePath = join(uploadsDir, relativePath);
  const subdir = relativePath.split("/").slice(0, -1).join("/");
  if (subdir) {
    const fullDir = join(uploadsDir, subdir);
    if (!existsSync(fullDir)) mkdirSync(fullDir, { recursive: true });
  }
  writeFileSync(absolutePath, buffer);
  return `/uploads/${relativePath}`;
}

export function getPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (base) return `${base}/${key}`;
  return `/${key}`;
}
