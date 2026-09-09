import type { AnalysisZone } from "@/types";
import { faceFrame, type Point } from "@/lib/faceLandmarks";

/**
 * Zone rectangles expressed in the face-anchored frame: units are inter-ocular
 * distances, origin at the eye midpoint, +x toward the right eye, +y toward the
 * chin. Kept as simple rectangles (not exact mesh polygons) because the whole
 * analysis is an approximate visual estimate and rectangles stay robust across
 * pose and are trivial to reason about. Each maps to a 4-point polygon in image
 * pixels via the landmark frame.
 */
const ZONE_RECTS: Record<AnalysisZone, { x0: number; x1: number; y0: number; y1: number }> = {
  forehead: { x0: -1.0, x1: 1.0, y0: -1.35, y1: -0.55 },
  "under-eye": { x0: -1.15, x1: 1.15, y0: 0.18, y1: 0.6 },
  cheeks: { x0: -1.65, x1: 1.65, y0: 0.6, y1: 1.45 },
  jawline: { x0: -1.5, x1: 1.5, y0: 1.6, y1: 2.7 },
  "tone-texture": { x0: -1.7, x1: 1.7, y0: -0.6, y1: 2.3 },
};

export const ALL_ZONES = Object.keys(ZONE_RECTS) as AnalysisZone[];

export type ZonePolygon = {
  name: AnalysisZone;
  /** 4 points, clockwise, in source-image pixel coordinates. */
  points: Point[];
};

/** Build image-space polygons for every zone from a face's landmarks. */
export function zonePolygons(keypoints: Point[]): ZonePolygon[] {
  const { origin, ax, ay, interocular } = faceFrame(keypoints);
  const toImage = (u: number, v: number): Point => ({
    x: origin.x + (ax.x * u + ay.x * v) * interocular,
    y: origin.y + (ax.y * u + ay.y * v) * interocular,
  });
  return ALL_ZONES.map((name) => {
    const r = ZONE_RECTS[name];
    return {
      name,
      points: [
        toImage(r.x0, r.y0),
        toImage(r.x1, r.y0),
        toImage(r.x1, r.y1),
        toImage(r.x0, r.y1),
      ],
    };
  });
}

/** Axis-aligned bounds of a polygon, clamped to [0,w) x [0,h). */
export function polygonBounds(
  points: Point[],
  w: number,
  h: number,
): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return {
    x0: Math.max(0, Math.floor(x0)),
    y0: Math.max(0, Math.floor(y0)),
    x1: Math.min(w - 1, Math.ceil(x1)),
    y1: Math.min(h - 1, Math.ceil(y1)),
  };
}

/** Even-odd point-in-polygon test. */
export function pointInPolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
