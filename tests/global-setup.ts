import { config as loadEnv } from "dotenv";
import { Client } from "pg";

/**
 * Clear rate-limit rows before an e2e run so repeated suites (which create many
 * accounts from one IP) don't hit the signup limiter.
 */
export default async function globalSetup() {
  loadEnv({ path: ".env.local" });
  loadEnv({ path: ".env" });
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    await client.query("TRUNCATE rate_limits");
  } catch {
    // DB not reachable at setup time — tests will surface it.
  } finally {
    await client.end().catch(() => {});
  }
}
