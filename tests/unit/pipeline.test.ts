import { describe, it, expect } from "vitest";
import type { Point } from "@/lib/faceLandmarks";
import { zonePolygons } from "@/lib/zones";
import { zoneMetric, compareZone, type ZoneComparison } from "@/lib/metrics";
import { buildAnalysisResult } from "@/lib/analysis";

/**
 * End-to-end determinism check for the analysis maths, without a browser or the
 * CV model: synthetic landmarks + synthetic pixel buffers in, a stable
 * AnalysisResult out. This is the guarantee that replaced the old
 * Math.random() implementation.
 */

const W = 200;
const H = 260;

function syntheticFace(): Point[] {
  const kp: Point[] = Array.from({ length: 468 }, () => ({ x: 0, y: 0 }));
  kp[33] = { x: 70, y: 110 };
  kp[133] = { x: 92, y: 110 };
  kp[362] = { x: 108, y: 110 };
  kp[263] = { x: 130, y: 110 };
  kp[1] = { x: 100, y: 140 };
  kp[2] = { x: 100, y: 150 };
  kp[152] = { x: 100, y: 210 };
  return kp;
}

function buffer(texAmp: number, redBias = 0): Uint8ClampedArray {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // Smooth base + a block pattern whose amplitude is the "texture" knob.
      const block = (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0 ? -1 : 1;
      const base = 150 + block * texAmp;
      d[i] = base + redBias;
      d[i + 1] = base;
      d[i + 2] = base;
      d[i + 3] = 255;
    }
  }
  return d;
}

const ctx = { landmarkScore: 1, alignmentResidualRatio: 0.01 };

function run(a: Uint8ClampedArray, b: Uint8ClampedArray): ZoneComparison[] {
  const polys = zonePolygons(syntheticFace());
  return polys.map((zp) =>
    compareZone(
      zp.name,
      zoneMetric(a, W, H, zp.points),
      zoneMetric(b, W, H, zp.points),
      ctx,
    ),
  );
}

describe("analysis pipeline (deterministic)", () => {
  it("identical photos -> every zone neutral, result stable across runs", () => {
    const img = buffer(25);
    const first = run(img, buffer(25));
    const second = run(img, buffer(25));
    expect(first).toEqual(second);
    for (const z of first) expect(z.change).toBe("neutral");

    const result = buildAnalysisResult(first, true);
    expect(result.zones.every((z) => z.change === "neutral")).toBe(true);
    expect(buildAnalysisResult(first, true)).toEqual(result);
  });

  it("smoother later photo -> zones improve", () => {
    const cmps = run(buffer(45), buffer(10));
    const scored = cmps.filter((c) => c.name !== "tone-texture");
    expect(scored.some((c) => c.change === "improved")).toBe(true);
    expect(scored.every((c) => c.change !== "worsened")).toBe(true);

    const result = buildAnalysisResult(cmps, true);
    expect(result.summary).toMatch(/improved/i);
  });

  it("rougher, redder later photo -> zones worsen", () => {
    const cmps = run(buffer(10), buffer(45, 40));
    const scored = cmps.filter((c) => c.name !== "tone-texture");
    expect(scored.some((c) => c.change === "worsened")).toBe(true);
  });

  it("free tier collapses to a summary regardless of zone detail", () => {
    const cmps = run(buffer(45), buffer(10));
    expect(buildAnalysisResult(cmps, false).zones).toEqual([]);
  });
});
