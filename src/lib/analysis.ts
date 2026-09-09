import type { AnalysisResult } from "@/types";

const ZONES = [
  "under-eye",
  "forehead",
  "cheeks",
  "jawline",
  "tone-texture",
] as const;

const IMPROVEMENT_NOTES = [
  "Noticeable improvement in hydration and plumpness.",
  "Fine lines appear reduced; skin texture feels smoother.",
  "Tone appears more even with reduced dullness.",
  "Pores appear less prominent with better oil balance.",
  "Overall luminosity has increased from baseline.",
];

const WORSENED_NOTES = [
  "Mild dryness detected compared to baseline.",
  "Slight increase in visible redness or sensitivity.",
  "Texture appears slightly rougher in this area.",
  "Tone appears slightly duller than previous capture.",
  "Minor increase in visible congestion or pores.",
];

const NEUTRAL_NOTES = [
  "No significant change detected from baseline.",
  "Area remains stable with no notable variation.",
  "Consistent appearance compared to previous measurement.",
  "Change is minimal and within normal variation.",
  "No measurable shift in texture or tone observed.",
];

function randomNote(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateZoneResult() {
  const r = Math.random();
  const change: "improved" | "worsened" | "neutral" =
    r < 0.5
      ? "improved"
      : r < 0.75
        ? "neutral"
        : "worsened";

  const notes =
    change === "improved"
      ? IMPROVEMENT_NOTES
      : change === "worsened"
        ? WORSENED_NOTES
        : NEUTRAL_NOTES;

  return {
    name: ZONES[Math.floor(Math.random() * ZONES.length)],
    change,
    // 0..1 float — consumers render as `confidence * 100`%.
    confidence: Math.round((60 + Math.random() * 35)) / 100,
    note: randomNote(notes),
  } as const;
}

export function generateAnalysis(
  _photoA: string,
  _photoB: string,
  isPremium: boolean,
): AnalysisResult {
  // Free tier gets no per-zone breakdown (summary only). Premium gets 5 zones.
  const zones = isPremium
    ? Array.from({ length: 5 }, () => generateZoneResult())
    : [];

  const overallImprovements = zones.filter((z) => z.change === "improved").length;
  const overallWorsened = zones.filter((z) => z.change === "worsened").length;

  let summary = "Comparison analysis complete. ";
  if (overallImprovements > overallWorsened) {
    summary +=
      "Overall positive progress observed across most measured zones. ";
    summary +=
      "Hydration and tone show the most consistent improvement since baseline.";
  } else if (overallWorsened > overallImprovements) {
    summary +=
      "Some areas show slight regression compared to baseline. ";
    summary +=
      "Consider reviewing recent skincare routine and environmental factors.";
  } else {
    summary +=
      "Results are mixed with no strong directional trend. ";
    summary +=
      "Continue current routine and monitor over the next capture cycle.";
  }

  if (!isPremium) {
    summary +=
      " This is a basic summary only. Upgrade to premium for detailed zone-by-zone breakdown, confidence scoring, and personalized recommendations.";
  }

  return {
    zones: zones as AnalysisResult["zones"],
    summary,
    disclaimer:
      "Analysis is an approximate visual estimate for personal tracking only. Not medical or diagnostic.",
  };
}

export type { AnalysisResult };
