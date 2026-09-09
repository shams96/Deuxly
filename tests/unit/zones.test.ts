import { describe, it, expect } from "vitest";
import { zonePolygons, pointInPolygon, polygonBounds, ALL_ZONES } from "@/lib/zones";
import { faceFrame, type Point } from "@/lib/faceLandmarks";

/**
 * Build a minimal synthetic keypoint array where only the indices faceFrame /
 * anchorPoints touch are meaningful. Eyes on a horizontal line, nose + chin
 * below.
 */
function syntheticFace(): Point[] {
  const kp: Point[] = Array.from({ length: 468 }, () => ({ x: 0, y: 0 }));
  kp[33] = { x: 80, y: 100 }; // left eye outer
  kp[133] = { x: 110, y: 100 }; // left eye inner
  kp[362] = { x: 150, y: 100 }; // right eye inner
  kp[263] = { x: 180, y: 100 }; // right eye outer
  kp[1] = { x: 130, y: 140 }; // nose tip (below eyes)
  kp[2] = { x: 130, y: 150 };
  kp[152] = { x: 130, y: 210 }; // chin
  return kp;
}

describe("faceFrame", () => {
  it("y axis points from eyes toward the chin", () => {
    const f = faceFrame(syntheticFace());
    expect(f.ay.y).toBeGreaterThan(0);
    expect(f.interocular).toBeGreaterThan(0);
    expect(f.origin.y).toBeCloseTo(100, 0);
  });
});

describe("zonePolygons", () => {
  const polys = zonePolygons(syntheticFace());

  it("produces one 4-point polygon per zone", () => {
    expect(polys.map((p) => p.name).sort()).toEqual([...ALL_ZONES].sort());
    for (const p of polys) expect(p.points).toHaveLength(4);
  });

  it("forehead sits above the eye line, jawline below the nose", () => {
    const forehead = polys.find((p) => p.name === "forehead")!;
    const jaw = polys.find((p) => p.name === "jawline")!;
    const meanY = (pts: Point[]) => pts.reduce((s, q) => s + q.y, 0) / pts.length;
    expect(meanY(forehead.points)).toBeLessThan(100);
    expect(meanY(jaw.points)).toBeGreaterThan(140);
  });

  it("a zone polygon contains its own centroid", () => {
    for (const p of polys) {
      const cx = p.points.reduce((s, q) => s + q.x, 0) / 4;
      const cy = p.points.reduce((s, q) => s + q.y, 0) / 4;
      expect(pointInPolygon(cx, cy, p.points)).toBe(true);
    }
  });
});

describe("pointInPolygon / polygonBounds", () => {
  const square = [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 20, y: 20 },
    { x: 10, y: 20 },
  ];
  it("inside vs outside", () => {
    expect(pointInPolygon(15, 15, square)).toBe(true);
    expect(pointInPolygon(5, 5, square)).toBe(false);
  });
  it("bounds are clamped to the image", () => {
    const b = polygonBounds(
      [
        { x: -5, y: -5 },
        { x: 50, y: 5 },
        { x: 50, y: 50 },
        { x: -5, y: 50 },
      ],
      30,
      30,
    );
    expect(b).toEqual({ x0: 0, y0: 0, x1: 29, y1: 29 });
  });
});
