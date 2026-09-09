import type { AnalysisZone } from "@/types";
import type { Point } from "@/lib/faceLandmarks";
import { pointInPolygon, polygonBounds } from "@/lib/zones";

export type ZoneMetric = {
  /** Mean luma, 0..1. */
  brightness: number;
  /** Mean local gradient magnitude (proxy for visible texture / fine lines), 0..1-ish. */
  texture: number;
  /** Mean redness = (R - (G+B)/2) normalised, 0..1 (clamped, only positive side). */
  redness: number;
  /** Pixels sampled — low counts mean low confidence. */
  samples: number;
};

const luma = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/**
 * Sample one zone from an RGBA buffer. Every pixel inside the polygon bounds is
 * tested; texture is the mean magnitude of the horizontal+vertical luma
 * gradient (a cheap Sobel-ish response) which rises with wrinkles, pores and
 * blotchiness.
 */
export function zoneMetric(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  polygon: Point[],
): ZoneMetric {
  const b = polygonBounds(polygon, width, height);
  let sumL = 0;
  let sumGrad = 0;
  let sumRed = 0;
  let n = 0;

  const at = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return luma(data[i], data[i + 1], data[i + 2]);
  };

  for (let y = b.y0; y <= b.y1; y++) {
    for (let x = b.x0; x <= b.x1; x++) {
      if (!pointInPolygon(x + 0.5, y + 0.5, polygon)) continue;
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const bl = data[i + 2];
      const l = luma(r, g, bl);
      sumL += l;
      sumRed += Math.max(0, (r - (g + bl) / 2) / 255);

      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        const gx = at(x + 1, y) - at(x - 1, y);
        const gy = at(x, y + 1) - at(x, y - 1);
        sumGrad += Math.hypot(gx, gy);
      }
      n++;
    }
  }

  if (n === 0) return { brightness: 0, texture: 0, redness: 0, samples: 0 };
  return {
    brightness: sumL / n,
    texture: (sumGrad / n) * 4, // scale into a friendlier 0..1 range
    redness: sumRed / n,
    samples: n,
  };
}

export type ZoneComparison = {
  name: AnalysisZone;
  change: "improved" | "worsened" | "neutral";
  confidence: number;
  deltas: { brightness: number; texture: number; redness: number };
  driver: "texture" | "redness" | "tone" | "none";
};

const IMPROVE_THRESHOLD = 0.012;

/**
 * Compare a zone between the baseline (A) and the later capture (B), both
 * already aligned and exposure-matched. Lower texture and lower redness read as
 * improvement; the reverse reads as regression. A large residual brightness
 * delta (lighting the exposure match could not remove) drags confidence down
 * and biases toward "neutral".
 */
export function compareZone(
  name: AnalysisZone,
  a: ZoneMetric,
  b: ZoneMetric,
  ctx: { landmarkScore: number; alignmentResidualRatio: number },
): ZoneComparison {
  const dTexture = b.texture - a.texture;
  const dRedness = b.redness - a.redness;
  const dBrightness = b.brightness - a.brightness;

  // Positive score = improvement.
  const score = -(0.6 * dTexture + 0.4 * dRedness);

  let change: ZoneComparison["change"] = "neutral";
  if (score > IMPROVE_THRESHOLD) change = "improved";
  else if (score < -IMPROVE_THRESHOLD) change = "worsened";

  let driver: ZoneComparison["driver"] = "none";
  if (change !== "neutral") {
    driver =
      Math.abs(dTexture) >= Math.abs(dRedness) ? "texture" : "redness";
  } else if (Math.abs(dBrightness) > 0.06) {
    driver = "tone";
  }

  const minSamples = Math.min(a.samples, b.samples);
  const sampleFactor = Math.min(1, minSamples / 1500);
  const lightingPenalty = Math.min(0.5, Math.abs(dBrightness) * 2.5);
  const alignPenalty = Math.min(0.4, ctx.alignmentResidualRatio * 3);

  let confidence =
    0.4 +
    0.55 * ctx.landmarkScore * sampleFactor -
    lightingPenalty -
    alignPenalty;
  confidence = Math.max(0.15, Math.min(0.95, confidence));

  if (lightingPenalty > 0.3 && change !== "neutral") {
    // Too much unexplained lighting drift to trust a directional call.
    change = "neutral";
    driver = "tone";
  }

  return {
    name,
    change,
    confidence: Math.round(confidence * 100) / 100,
    deltas: { brightness: dBrightness, texture: dTexture, redness: dRedness },
    driver,
  };
}
