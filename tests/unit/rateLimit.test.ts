import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  it("allows up to max within the window, then blocks", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("isolates counts per key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(checkRateLimit(a, 1, 60_000)).toBe(true);
    expect(checkRateLimit(a, 1, 60_000)).toBe(false);
    expect(checkRateLimit(b, 1, 60_000)).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const key = `w-${Math.random()}`;
    expect(checkRateLimit(key, 1, 10)).toBe(true);
    expect(checkRateLimit(key, 1, 10)).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(checkRateLimit(key, 1, 10)).toBe(true);
  });
});
