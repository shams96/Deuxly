import { describe, it, expect, vi, beforeEach } from "vitest";

const queryRaw = vi.fn();
const deleteMany = vi.fn().mockResolvedValue({ count: 0 });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    rateLimit: { deleteMany: (...args: unknown[]) => deleteMany(...args) },
  },
}));

const { checkRateLimit } = await import("@/lib/rateLimit");

beforeEach(() => {
  queryRaw.mockReset();
  deleteMany.mockClear();
});

describe("checkRateLimit", () => {
  it("allows while the window count is within max", async () => {
    queryRaw.mockResolvedValueOnce([{ count: 3 }]);
    expect(await checkRateLimit("k", 5, 60_000)).toBe(true);
  });

  it("blocks once the window count exceeds max", async () => {
    queryRaw.mockResolvedValueOnce([{ count: 6 }]);
    expect(await checkRateLimit("k", 5, 60_000)).toBe(false);
  });

  it("treats the boundary (count === max) as allowed", async () => {
    queryRaw.mockResolvedValueOnce([{ count: 5 }]);
    expect(await checkRateLimit("k", 5, 60_000)).toBe(true);
  });

  it("fails open when the store is unreachable", async () => {
    queryRaw.mockRejectedValueOnce(new Error("db down"));
    expect(await checkRateLimit("k", 1, 60_000)).toBe(true);
  });

  it("passes the key and a future reset timestamp to the query", async () => {
    queryRaw.mockResolvedValueOnce([{ count: 1 }]);
    const before = Date.now();
    await checkRateLimit("upload:user-1", 10, 60_000);
    const params = queryRaw.mock.calls[0].slice(1) as unknown[];
    expect(params).toContain("upload:user-1");
    const reset = params.find((p) => p instanceof Date) as Date;
    expect(reset.getTime()).toBeGreaterThan(before);
  });
});
