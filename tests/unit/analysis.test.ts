import { describe, it, expect } from "vitest";
import { buildAnalysisResult, validateAnalysisResult } from "@/lib/analysis";
import type { ZoneComparison } from "@/lib/metrics";

const cmp = (
  name: ZoneComparison["name"],
  change: ZoneComparison["change"],
): ZoneComparison => ({
  name,
  change,
  confidence: 0.8,
  deltas: { brightness: 0, texture: 0, redness: 0 },
  driver: change === "neutral" ? "none" : "texture",
});

describe("buildAnalysisResult", () => {
  const comparisons: ZoneComparison[] = [
    cmp("forehead", "improved"),
    cmp("under-eye", "improved"),
    cmp("cheeks", "worsened"),
    cmp("jawline", "neutral"),
    cmp("tone-texture", "neutral"),
  ];

  it("premium: one entry per scored zone, tone-texture excluded", () => {
    const r = buildAnalysisResult(comparisons, true);
    expect(r.zones.map((z) => z.name).sort()).toEqual(
      ["cheeks", "forehead", "jawline", "under-eye"],
    );
    for (const z of r.zones) {
      expect(z.confidence).toBeGreaterThan(0);
      expect(z.confidence).toBeLessThanOrEqual(1);
      expect(z.note.length).toBeGreaterThan(0);
    }
    expect(r.disclaimer).toMatch(/not medical/i);
  });

  it("premium summary reflects the majority direction", () => {
    expect(buildAnalysisResult(comparisons, true).summary).toMatch(/improved/i);
  });

  it("free tier: no zones, summary nudges upgrade", () => {
    const r = buildAnalysisResult(comparisons, false);
    expect(r.zones).toEqual([]);
    expect(r.summary).toMatch(/upgrade/i);
  });
});

describe("validateAnalysisResult", () => {
  const good = buildAnalysisResult(
    [cmp("forehead", "improved"), cmp("cheeks", "worsened")],
    true,
  );

  it("accepts a well-formed result", () => {
    expect(validateAnalysisResult(JSON.parse(JSON.stringify(good)))).not.toBeNull();
  });

  it("rejects non-objects", () => {
    expect(validateAnalysisResult(null)).toBeNull();
    expect(validateAnalysisResult("x")).toBeNull();
  });

  it("rejects bad change enum", () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.zones[0].change = "better";
    expect(validateAnalysisResult(bad)).toBeNull();
  });

  it("rejects confidence outside 0..1", () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.zones[0].confidence = 1.4;
    expect(validateAnalysisResult(bad)).toBeNull();
  });

  it("rejects unknown zone names", () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.zones[0].name = "nose";
    expect(validateAnalysisResult(bad)).toBeNull();
  });
});
