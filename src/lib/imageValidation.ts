/** Upload guard: real image bytes, sane size, sane dimensions. */

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
export const MIN_DIMENSION = 64;
export const MAX_DIMENSION = 8000;

type SniffResult = "image/jpeg" | "image/png" | "image/webp" | null;

/** Identify an image from its leading bytes, ignoring any declared MIME. */
export function sniffImageType(buf: Buffer): SniffResult {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "image/png";
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

export type ValidationOk = {
  ok: true;
  /** Re-encoded JPEG (EXIF and any non-image payload stripped). */
  jpeg: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
};
export type ValidationErr = { ok: false; error: string; status: 400 | 413 | 415 };

/**
 * Validate then normalise an uploaded image: magic-byte sniff, dimension
 * bounds, and a full re-encode through sharp so the stored bytes contain only
 * pixel data (no EXIF/GPS, no trailing payloads).
 */
export async function validateAndNormalizeImage(
  buf: Buffer,
): Promise<ValidationOk | ValidationErr> {
  if (buf.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Image is larger than 12 MB", status: 413 };
  }
  if (!sniffImageType(buf)) {
    return { ok: false, error: "File is not a JPEG, PNG or WebP image", status: 415 };
  }

  let sharp: typeof import("sharp").default;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return { ok: false, error: "Image processing unavailable", status: 400 };
  }

  let meta;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    return { ok: false, error: "Image could not be read", status: 400 };
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (
    width < MIN_DIMENSION ||
    height < MIN_DIMENSION ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION
  ) {
    return {
      ok: false,
      error: `Image dimensions must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}px`,
      status: 400,
    };
  }

  try {
    const jpeg = await sharp(buf).rotate().jpeg({ quality: 85 }).toBuffer();
    const thumbnail = await sharp(buf)
      .rotate()
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    return { ok: true, jpeg, thumbnail, width, height };
  } catch {
    return { ok: false, error: "Image could not be processed", status: 400 };
  }
}
