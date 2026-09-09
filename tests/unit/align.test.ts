import { describe, it, expect } from "vitest";
import {
  estimateSimilarity,
  applySimilarity,
  similarityResidual,
  channelStats,
  matchExposure,
} from "@/lib/align";

const src = [
  { x: 10, y: 10 },
  { x: 90, y: 12 },
  { x: 50, y: 80 },
  { x: 20, y: 60 },
];

describe("estimateSimilarity", () => {
  it("recovers a known scale + rotation + translation", () => {
    const s = 1.3;
    const theta = 0.4;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const tx = 25;
    const ty = -15;
    const dst = src.map((p) => ({
      x: s * (cos * p.x - sin * p.y) + tx,
      y: s * (sin * p.x + cos * p.y) + ty,
    }));

    const t = estimateSimilarity(src, dst);
    expect(t.a).toBeCloseTo(s * cos, 4);
    expect(t.b).toBeCloseTo(s * sin, 4);
    expect(t.tx).toBeCloseTo(tx, 3);
    expect(t.ty).toBeCloseTo(ty, 3);
    expect(similarityResidual(t, src, dst)).toBeLessThan(1e-6);
  });

  it("returns identity for < 2 points", () => {
    expect(estimateSimilarity([{ x: 1, y: 2 }], [{ x: 3, y: 4 }])).toEqual({
      a: 1,
      b: 0,
      tx: 0,
      ty: 0,
    });
  });

  it("applySimilarity round-trips a mapped point", () => {
    const t = { a: 0.9, b: 0.2, tx: 5, ty: -3 };
    const p = applySimilarity(t, { x: 4, y: 7 });
    expect(p.x).toBeCloseTo(0.9 * 4 - 0.2 * 7 + 5);
    expect(p.y).toBeCloseTo(0.2 * 4 + 0.9 * 7 - 3);
  });
});

describe("exposure matching", () => {
  it("matchExposure moves channel means toward the reference", () => {
    const w = 8;
    const h = 8;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = 60;
      data[i * 4 + 1] = 70;
      data[i * 4 + 2] = 80;
      data[i * 4 + 3] = 255;
    }
    const bounds = { x0: 0, y0: 0, x1: w - 1, y1: h - 1 };
    const from = channelStats(data, w, bounds);
    const to = { mean: [120, 120, 120] as [number, number, number], std: from.std };
    matchExposure(data, from, to);
    const after = channelStats(data, w, bounds);
    expect(after.mean[0]).toBeCloseTo(120, 0);
    expect(after.mean[1]).toBeCloseTo(120, 0);
    expect(after.mean[2]).toBeCloseTo(120, 0);
  });
});
