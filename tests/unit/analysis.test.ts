import { describe, it, expect } from "vitest";
import { generateAnalysis } from "@/lib/analysis";

describe("generateAnalysis", () => {
  it("returns a well-formed result for premium (5 zones)", () => {
    const r = generateAnalysis("a", "b", true);
    expect(r.zones).toHaveLength(5);
    expect(typeof r.summary).toBe("string");
    expect(r.disclaimer).toMatch(/not medical/i);
    for (const z of r.zones) {
      expect(["improved", "worsened", "neutral"]).toContain(z.change);
      expect(z.confidence).toBeGreaterThan(0);
      expect(z.confidence).toBeLessThanOrEqual(1);
      expect(typeof z.note).toBe("string");
    }
  });

  it("returns no per-zone breakdown for free tier", () => {
    const r = generateAnalysis("a", "b", false);
    expect(r.zones).toEqual([]);
    expect(r.summary).toMatch(/upgrade/i);
  });

  it("confidence is a 0..1 float, not a percentage", () => {
    for (let i = 0; i < 50; i++) {
      for (const z of generateAnalysis("a", "b", true).zones) {
        expect(z.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});
