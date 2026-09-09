/**
 * Client-only orchestrator: two skin photos in, a real AnalysisResult out.
 *
 * Pipeline: detect FaceMesh landmarks on both -> estimate a similarity
 * transform registering B onto A -> exposure-match B to A -> sample per-zone
 * brightness / texture / redness on both -> compare -> summarise.
 */
import type { AnalysisResult, AnalysisZone } from "@/types";
import { detectLandmarks, faceFrame } from "@/lib/faceLandmarks";
import {
  anchorPoints,
  channelStats,
  estimateSimilarity,
  matchExposure,
  similarityResidual,
} from "@/lib/align";
import { zonePolygons, polygonBounds } from "@/lib/zones";
import { zoneMetric, compareZone, type ZoneComparison } from "@/lib/metrics";
import { buildAnalysisResult } from "@/lib/analysis";

const WORK_MAX_SIDE = 640;

export type OverlayZone = {
  name: AnalysisZone;
  change: ZoneComparison["change"];
  /** Polygon points normalised to 0..1 of the working image. */
  polygon: Array<{ x: number; y: number }>;
};

export type ComparisonOutput = {
  result: AnalysisResult;
  overlay: { zones: OverlayZone[] };
  meta: { alignmentResidualRatio: number; ok: true };
};

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${url}`));
    img.src = url;
  });
}

function rasterize(img: HTMLImageElement): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
} {
  const scale = Math.min(1, WORK_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/**
 * Run the full comparison. Returns null when a face cannot be found in one or
 * both photos or the CV model fails to load — the caller should fall back to a
 * plain side-by-side with no analysis.
 */
export async function analyzeComparison(
  photoAUrl: string,
  photoBUrl: string,
  isPremium: boolean,
): Promise<ComparisonOutput | null> {
  if (typeof window === "undefined") return null;

  let imgA: HTMLImageElement;
  let imgB: HTMLImageElement;
  try {
    [imgA, imgB] = await Promise.all([loadImage(photoAUrl), loadImage(photoBUrl)]);
  } catch {
    return null;
  }

  const A = rasterize(imgA);
  const B = rasterize(imgB);

  const [lmA, lmB] = await Promise.all([
    detectLandmarks(A.canvas),
    detectLandmarks(B.canvas),
  ]);
  if (!lmA || !lmB) return null;

  // Register B onto A.
  const srcAnchors = anchorPoints(lmB.keypoints);
  const dstAnchors = anchorPoints(lmA.keypoints);
  const transform = estimateSimilarity(srcAnchors, dstAnchors);
  const residualPx = similarityResidual(transform, srcAnchors, dstAnchors);
  const frameA = faceFrame(lmA.keypoints);
  const alignmentResidualRatio = residualPx / frameA.interocular;

  // Draw aligned B at A's dimensions.
  const alignedCanvas = document.createElement("canvas");
  alignedCanvas.width = A.w;
  alignedCanvas.height = A.h;
  const alignedCtx = alignedCanvas.getContext("2d", { willReadFrequently: true });
  if (!alignedCtx) return null;
  // affine: x' = a*x - b*y + tx ; y' = b*x + a*y + ty
  alignedCtx.setTransform(transform.a, transform.b, -transform.b, transform.a, transform.tx, transform.ty);
  alignedCtx.drawImage(B.canvas, 0, 0);
  alignedCtx.setTransform(1, 0, 0, 1, 0, 0);

  const aData = A.ctx.getImageData(0, 0, A.w, A.h).data;
  const alignedImage = alignedCtx.getImageData(0, 0, A.w, A.h);
  const bData = alignedImage.data;

  // Exposure-match aligned B to A over A's face box.
  const faceBox = polygonBounds(
    [
      { x: lmA.box.xMin, y: lmA.box.yMin },
      { x: lmA.box.xMax, y: lmA.box.yMin },
      { x: lmA.box.xMax, y: lmA.box.yMax },
      { x: lmA.box.xMin, y: lmA.box.yMax },
    ],
    A.w,
    A.h,
  );
  const statsA = channelStats(aData, A.w, faceBox);
  const statsB = channelStats(bData, A.w, faceBox);
  matchExposure(bData, statsB, statsA);

  // Sample every zone on both images.
  const polys = zonePolygons(lmA.keypoints);
  const comparisons: ZoneComparison[] = polys.map((zp) => {
    const mA = zoneMetric(aData, A.w, A.h, zp.points);
    const mB = zoneMetric(bData, A.w, A.h, zp.points);
    return compareZone(zp.name, mA, mB, {
      landmarkScore: Math.min(lmA.score, lmB.score),
      alignmentResidualRatio,
    });
  });

  const result = buildAnalysisResult(comparisons, isPremium);

  const overlay: { zones: OverlayZone[] } = {
    zones: polys
      .filter((zp) => zp.name !== "tone-texture")
      .map((zp) => {
        const cmp = comparisons.find((c) => c.name === zp.name)!;
        return {
          name: zp.name,
          change: cmp.change,
          polygon: zp.points.map((p) => ({ x: p.x / A.w, y: p.y / A.h })),
        };
      }),
  };

  return { result, overlay, meta: { alignmentResidualRatio, ok: true } };
}
