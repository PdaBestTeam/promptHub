import { config } from "dotenv";

import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  migrations: {
    table: "__drizzle_migrations_promptHub",
    schema: "promptHub",
  },

  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
