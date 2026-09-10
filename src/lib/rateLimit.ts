import { prisma } from "@/lib/prisma";

/**
 * Postgres-backed fixed-window rate limit. Unlike an in-process map this holds
 * across serverless instances and cold starts.
 *
 * Returns true when the call is allowed, false when the limit is exceeded for
 * the current window. Fails open (returns true) if the store is unreachable —
 * rate limiting should never take the whole endpoint down.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at <= now() THEN 1
                     ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at <= now() THEN ${resetAt}
                        ELSE rate_limits.reset_at END
      RETURNING count
    `;
    const count = rows[0]?.count ?? 1;

    // Opportunistic cleanup of stale rows.
    if (Math.random() < 0.02) {
      prisma.rateLimit
        .deleteMany({ where: { resetAt: { lte: new Date() } } })
        .catch(() => {});
    }

    return count <= max;
  } catch {
    return true;
  }
}
