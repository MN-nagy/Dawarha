import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);

// Use a global singleton to prevent multiple connections during hot-reloads
const globalForDb = globalThis as unknown as {
  conn: typeof sql | undefined;
};

// Reuse existing connection if available, otherwise create a new one
const conn = globalForDb.conn ?? sql;

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn);
