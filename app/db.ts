import { Pool } from "pg";

// Railway inyecta automáticamente DATABASE_URL cuando agregás el plugin de PostgreSQL
// al mismo proyecto. No hace falta escribir la URL a mano.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
