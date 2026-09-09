import { describe, it, expect } from "vitest";
import { zoneMetric, compareZone, type ZoneMetric } from "@/lib/metrics";

const W = 40;
const H = 40;
const fullPoly = [
  { x: 0, y: 0 },
  { x: W, y: 0 },
  { x: W, y: H },
  { x: 0, y: H },
];

function fill(rgb: (x: number, y: number) => [number, number, number]) {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const [r, g, b] = rgb(x, y);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  return d;
}

describe("zoneMetric", () => {
  it("flat gray: near-zero texture, mid brightness, ~zero redness", () => {
    const m = zoneMetric(fill(() => [128, 128, 128]), W, H, fullPoly);
    expect(m.texture).toBeLessThan(0.01);
    expect(m.brightness).toBeCloseTo(0.5, 1);
    expect(m.redness).toBeLessThan(0.01);
    expect(m.samples).toBeGreaterThan(1000);
  });

  it("a blocky pattern has clearly higher texture than flat", () => {
    const flat = zoneMetric(fill(() => [128, 128, 128]), W, H, fullPoly);
    // 5px blocks so a +/-1 central difference actually crosses edges.
    const blocky = zoneMetric(
      fill((x, y) =>
        (Math.floor(x / 5) + Math.floor(y / 5)) % 2 === 0
          ? [40, 40, 40]
          : [220, 220, 220],
      ),
      W,
      H,
      fullPoly,
    );
    expect(blocky.texture).toBeGreaterThan(flat.texture + 0.1);
  });

  it("red field registers redness", () => {
    const m = zoneMetric(fill(() => [200, 90, 90]), W, H, fullPoly);
    expect(m.redness).toBeGreaterThan(0.2);
  });
});

const base: ZoneMetric = { brightness: 0.5, texture: 0.3, redness: 0.1, samples: 4000 };
const ctx = { landmarkScore: 1, alignmentResidualRatio: 0.02 };

describe("compareZone", () => {
  it("identical metrics -> neutral", () => {
    const r = compareZone("forehead", base, { ...base }, ctx);
    expect(r.change).toBe("neutral");
  });

  it("lower texture in B -> improved, driven by texture", () => {
    const r = compareZone("forehead", base, { ...base, texture: 0.2 }, ctx);
    expect(r.change).toBe("improved");
    expect(r.driver).toBe("texture");
  });

  it("higher texture in B -> worsened", () => {
    const r = compareZone("forehead", base, { ...base, texture: 0.45 }, ctx);
    expect(r.change).toBe("worsened");
  });

  it("large unexplained brightness delta forces neutral with low confidence", () => {
    const r = compareZone(
      "forehead",
      base,
      { ...base, texture: 0.1, brightness: 0.85 },
      ctx,
    );
    expect(r.change).toBe("neutral");
    expect(r.confidence).toBeLessThan(0.5);
  });

  it("confidence stays within 0..1", () => {
    const r = compareZone("cheeks", base, { ...base, texture: 0.15 }, {
      landmarkScore: 1,
      alignmentResidualRatio: 0,
    });
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});
