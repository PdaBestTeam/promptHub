import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

declare global {
  var __serverPool: Pool | undefined;
}

const pool =
  global.__serverPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__serverPool = pool;
}

export const db = drizzle(pool, { schema });
