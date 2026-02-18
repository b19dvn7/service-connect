import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL not set. Database features will be disabled.");
}

export const pool = connectionString ? new Pool({ connectionString }) : null;
export const db = pool ? drizzle(pool, { schema }) : null;

export async function runMigrations() {
  if (!pool) return;
  await pool.query(`
    ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS truck_number TEXT;
  `);
  await pool.query(`
    ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS address TEXT;
  `);
}
