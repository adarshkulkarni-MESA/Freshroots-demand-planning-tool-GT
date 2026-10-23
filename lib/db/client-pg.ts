import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

// Unified execute helper — converts ? placeholders to $N for PostgreSQL
export async function pgExec(
  sql: string,
  args: (string | number | null)[] = []
) {
  const client = getSql();
  // neon tagged template doesn't support dynamic queries well; use unsafe() pattern
  // Replace ? with $1, $2, ... for compatibility
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any)(pgSql, args);
}
