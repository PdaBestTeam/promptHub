// Run this once to create the schema: pnpm tsx src/lib/db/create-schema.ts
import { config } from "dotenv";
config({ path: ".env" });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSchema() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "promptHub"`);
    console.log('Schema "promptHub" created (or already exists)');
  } finally {
    client.release();
    await pool.end();
  }
}

createSchema().catch(console.error);
