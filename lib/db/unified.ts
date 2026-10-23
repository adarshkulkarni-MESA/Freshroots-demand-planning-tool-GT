"use server";
import { createClient } from "@libsql/client";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || "file:./freshroots.db";

export function isPostgres(): boolean {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

let _libsql: ReturnType<typeof createClient> | null = null;
let _neon: ReturnType<typeof neon> | null = null;

function getLibsql() {
  if (!_libsql) _libsql = createClient({ url });
  return _libsql;
}

function getNeon() {
  if (!_neon) _neon = neon(url);
  return _neon;
}

// Execute with ? placeholders. For PostgreSQL, converts ? → $1, $2, ...
export async function dbExec(
  sql: string,
  args: (string | number | null)[] = []
): Promise<{ rows: Record<string, unknown>[] }> {
  if (isPostgres()) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    // Convert INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING
    const cleanSql = pgSql
      .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO")
      .replace(/;?\s*$/, " ON CONFLICT DO NOTHING");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await (getNeon() as any).query(cleanSql, args)) as Record<string, unknown>[];
    return { rows };
  }
  const result = await getLibsql().execute({ sql, args });
  return { rows: result.rows as Record<string, unknown>[] };
}

// Execute returning the auto-generated id
export async function dbExecWithId(
  sql: string,
  args: (string | number | null)[] = []
): Promise<number> {
  if (isPostgres()) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const withReturn = pgSql.replace(/;?\s*$/, " RETURNING id");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await (getNeon() as any).query(withReturn, args)) as { id: number }[];
    return rows[0]?.id ?? 0;
  }
  const result = await getLibsql().execute({ sql, args });
  return Number(result.lastInsertRowid);
}

// Query returning typed rows
export async function dbQuery<T extends Record<string, unknown>>(
  sql: string,
  args: (string | number | null)[] = []
): Promise<T[]> {
  if (isPostgres()) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await (getNeon() as any).query(pgSql, args)) as T[];
  }
  const result = await getLibsql().execute({ sql, args });
  return result.rows as unknown as T[];
}
