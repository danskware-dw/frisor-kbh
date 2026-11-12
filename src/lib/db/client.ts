import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. See .env.example for setup instructions."
    );
  }
  // Supabase pooler session mode (port 5432) has a strict pool size limit (default 15)
  // which causes fatal (EMAXCONNSESSION) errors in serverless environments like Vercel.
  // Switch to transaction mode pooler (port 6543) which multiplexes connections per transaction.
  // In automated test runs that rely on session-level `SET search_path`, retain session mode.
  const isTest = process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test";
  if (!isTest && url.includes(".pooler.supabase.com:5432")) {
    url = url.replace(/(pooler\.supabase\.com):5432/, "$1:6543");
  }
  return url;
}

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    const pool = new pg.Pool({
      connectionString: getDatabaseUrl(),
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    });
    db = drizzle(pool, { schema });
  }
  return db;
}
