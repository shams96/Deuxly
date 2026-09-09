import type { AnalysisResult, AnalysisZone } from "@/types";
import type { ZoneComparison } from "@/lib/metrics";

const DISCLAIMER =
  "Analysis is an approximate visual estimate for personal tracking only. Not medical or diagnostic.";

const ZONE_NAMES: readonly AnalysisZone[] = [
  "under-eye",
  "forehead",
  "cheeks",
  "jawline",
  "tone-texture",
];
const CHANGES = ["improved", "worsened", "neutral"] as const;

/**
 * Validate an AnalysisResult received from the (untrusted) client before it is
 * persisted. Returns a sanitised copy or null.
 */
export function validateAnalysisResult(input: unknown): AnalysisResult | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  if (typeof r.summary !== "string" || r.summary.length > 2000) return null;
  if (typeof r.disclaimer !== "string" || r.disclaimer.length > 500) return null;
  if (!Array.isArray(r.zones) || r.zones.length > 8) return null;

  const zones: AnalysisResult["zones"] = [];
  for (const z of r.zones) {
    if (typeof z !== "object" || z === null) return null;
    const zz = z as Record<string, unknown>;
    if (!ZONE_NAMES.includes(zz.name as AnalysisZone)) return null;
    if (!CHANGES.includes(zz.change as (typeof CHANGES)[number])) return null;
    if (
      typeof zz.confidence !== "number" ||
      !Number.isFinite(zz.confidence) ||
      zz.confidence < 0 ||
      zz.confidence > 1
    )
      return null;
    if (typeof zz.note !== "string" || zz.note.length > 500) return null;
    zones.push({
      name: zz.name as AnalysisZone,
      change: zz.change as (typeof CHANGES)[number],
      confidence: Math.round(zz.confidence * 100) / 100,
      note: zz.note,
    });
  }

  return { zones, summary: r.summary, disclaimer: r.disclaimer };
}

function noteFor(z: ZoneComparison): string {
  if (z.change === "improved") {
    if (z.driver === "texture")
      return "Surface texture looks smoother than baseline — fewer visible fine lines or roughness.";
    if (z.driver === "redness")
      return "Less visible redness and blotchiness than baseline.";
    return "Overall appearance is more even than baseline.";
  }
  if (z.change === "worsened") {
    if (z.driver === "texture")
      return "Surface texture looks rougher than baseline — more visible unevenness.";
    if (z.driver === "redness")
      return "More visible redness or sensitivity than baseline.";
    return "Slightly less even than baseline.";
  }
  if (z.driver === "tone")
    return "Lighting differed between the two photos, so this area is reported as unchanged.";
  return "No meaningful change from baseline in this area.";
}

/**
 * Turn per-zone comparisons into the user-facing result. Free tier gets a
 * summary only (no zones array); premium gets every zone with a note.
 */
export function buildAnalysisResult(
  comparisons: ZoneComparison[],
  isPremium: boolean,
): AnalysisResult {
  const scored = comparisons.filter((c) => c.name !== "tone-texture");
  const improved = scored.filter((c) => c.change === "improved").length;
  const worsened = scored.filter((c) => c.change === "worsened").length;

  let summary: string;
  if (improved > worsened) {
    summary =
      "Overall, most measured areas look improved since baseline — the clearest gains are in texture and evenness.";
  } else if (worsened > improved) {
    summary =
      "Some areas look slightly less even than baseline. Consider recent routine changes, sleep, or environment.";
  } else {
    summary =
      "Results are mixed with no strong overall direction. Keep the current routine and re-check next capture.";
  }
  if (!isPremium) {
    summary +=
      " Upgrade to Premium for a zone-by-zone breakdown with confidence scoring.";
  }

  const zones: AnalysisResult["zones"] = isPremium
    ? comparisons
        .filter((c) => c.name !== "tone-texture")
        .map((c) => ({
          name: c.name,
          change: c.change,
          confidence: c.confidence,
          note: noteFor(c),
        }))
    : [];

  return { zones, summary, disclaimer: DISCLAIMER };
}

export type { AnalysisResult };
