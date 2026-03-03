import { config } from "dotenv";

import { defineConfig } from "drizzle-kit";

// drizzle-kit 실행 시 .env를 먼저 로드해서 DATABASE_URL을 읽는다.
config({ path: ".env" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  migrations: {
    table: "__drizzle_migrations_my-next-app",
    schema: "my-next-app-schema",
  },

  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
