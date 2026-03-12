import 'dotenv/config';
import { defineConfig } from "prisma/config";

// Neon: use the direct (non-pooled) URL for migrations; fall back to DATABASE_URL for local dev
const migrationUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:rbacs123@localhost:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
});