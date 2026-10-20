import { Pool } from "pg";

// Global connection cache for Serverless Functions to reuse across invocations
declare global {
  // eslint-disable-next-line no-var
  var __postgresPool: Pool | undefined;
}

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

let pool: Pool | null = null;

if (connectionString) {
  if (!global.__postgresPool) {
    global.__postgresPool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production" || connectionString.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = global.__postgresPool;
}

export { pool };

export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  if (!pool) {
    throw new Error(
      "Database not configured. Please set POSTGRES_URL in environment variables."
    );
  }
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
