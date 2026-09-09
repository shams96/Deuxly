import type { Point } from "@/lib/faceLandmarks";
import { IDX } from "@/lib/faceLandmarks";

/**
 * 2D similarity transform: [x' y'] = s*R*[x y] + t.
 * Stored as the affine coefficients (a, b, tx, ty) where
 *   x' = a*x - b*y + tx
 *   y' = b*x + a*y + ty
 */
export type Similarity = { a: number; b: number; tx: number; ty: number };

export const IDENTITY: Similarity = { a: 1, b: 0, tx: 0, ty: 0 };

/**
 * Least-squares similarity transform mapping `src` points onto `dst` points
 * (Umeyama, similarity case). Needs >= 2 correspondences.
 */
export function estimateSimilarity(src: Point[], dst: Point[]): Similarity {
  const n = Math.min(src.length, dst.length);
  if (n < 2) return IDENTITY;

  let mSrcX = 0;
  let mSrcY = 0;
  let mDstX = 0;
  let mDstY = 0;
  for (let i = 0; i < n; i++) {
    mSrcX += src[i].x;
    mSrcY += src[i].y;
    mDstX += dst[i].x;
    mDstY += dst[i].y;
  }
  mSrcX /= n;
  mSrcY /= n;
  mDstX /= n;
  mDstY /= n;

  let sxx = 0; // sum(srcDx * dstDx + srcDy * dstDy)
  let sxy = 0; // sum(srcDx * dstDy - srcDy * dstDx)
  let srcVar = 0;
  for (let i = 0; i < n; i++) {
    const sdx = src[i].x - mSrcX;
    const sdy = src[i].y - mSrcY;
    const ddx = dst[i].x - mDstX;
    const ddy = dst[i].y - mDstY;
    sxx += sdx * ddx + sdy * ddy;
    sxy += sdx * ddy - sdy * ddx;
    srcVar += sdx * sdx + sdy * sdy;
  }
  if (srcVar === 0) return { a: 1, b: 0, tx: mDstX - mSrcX, ty: mDstY - mSrcY };

  const a = sxx / srcVar;
  const b = sxy / srcVar;
  const tx = mDstX - (a * mSrcX - b * mSrcY);
  const ty = mDstY - (b * mSrcX + a * mSrcY);
  return { a, b, tx, ty };
}

export function applySimilarity(t: Similarity, p: Point): Point {
  return {
    x: t.a * p.x - t.b * p.y + t.tx,
    y: t.b * p.x + t.a * p.y + t.ty,
  };
}

/** RMS residual of a transform over correspondences, in pixels. */
export function similarityResidual(
  t: Similarity,
  src: Point[],
  dst: Point[],
): number {
  const n = Math.min(src.length, dst.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const m = applySimilarity(t, src[i]);
    sum += (m.x - dst[i].x) ** 2 + (m.y - dst[i].y) ** 2;
  }
  return Math.sqrt(sum / n);
}

/** Stable correspondence anchors: eyes, nose tip, chin. */
export function anchorPoints(keypoints: Point[]): Point[] {
  return [
    keypoints[IDX.leftEyeOuter],
    keypoints[IDX.leftEyeInner],
    keypoints[IDX.rightEyeInner],
    keypoints[IDX.rightEyeOuter],
    keypoints[IDX.noseTip],
    keypoints[IDX.chin],
  ];
}

export type ChannelStats = { mean: [number, number, number]; std: [number, number, number] };

/** Per-channel mean/std over the pixels inside `bounds` of an RGBA buffer. */
export function channelStats(
  data: Uint8ClampedArray,
  width: number,
  bounds: { x0: number; y0: number; x1: number; y1: number },
): ChannelStats {
  let n = 0;
  const sum: [number, number, number] = [0, 0, 0];
  const sumSq: [number, number, number] = [0, 0, 0];
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const v = data[i + c];
        sum[c] += v;
        sumSq[c] += v * v;
      }
      n++;
    }
  }
  if (n === 0) return { mean: [0, 0, 0], std: [1, 1, 1] };
  const mean: [number, number, number] = [sum[0] / n, sum[1] / n, sum[2] / n];
  const std: [number, number, number] = [0, 1, 2].map((c) =>
    Math.max(1, Math.sqrt(Math.max(0, sumSq[c] / n - mean[c] * mean[c]))),
  ) as [number, number, number];
  return { mean, std };
}

/**
 * Match `data`'s per-channel mean/std to a reference (in place). Neutralises
 * exposure and white-balance drift between the two captures so downstream
 * texture/redness deltas reflect the skin, not the lighting.
 */
export function matchExposure(
  data: Uint8ClampedArray,
  from: ChannelStats,
  to: ChannelStats,
): void {
  const gain: [number, number, number] = [0, 1, 2].map(
    (c) => to.std[c] / from.std[c],
  ) as [number, number, number];
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = (data[i + c] - from.mean[c]) * gain[c] + to.mean[c];
      data[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}
