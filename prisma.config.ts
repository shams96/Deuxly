import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 does not auto-load .env for CLI commands. Load .env.local then .env
// (first value wins), matching Next.js precedence.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
