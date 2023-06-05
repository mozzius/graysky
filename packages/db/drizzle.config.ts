import type { Config } from "drizzle-kit";

export default {
  connectionString: process.env.DATABASE_URL,
  schema: "./schema.ts",
} satisfies Config;
