import { config } from "dotenv";
config({ path: ".env" });
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await pool.query(`
    DROP TABLE IF EXISTS "promptHub".scraps CASCADE;
    DROP TABLE IF EXISTS "promptHub".prompt_versions CASCADE;
    DROP TABLE IF EXISTS "promptHub".prompts CASCADE;
    DROP TABLE IF EXISTS "promptHub".categories CASCADE;
    DROP TABLE IF EXISTS "promptHub".users CASCADE;
    DROP TABLE IF EXISTS "promptHub".drizzle_migrations_promptHub CASCADE;
  `);
  console.log("✅ 기존 테이블 전부 삭제 완료");
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
