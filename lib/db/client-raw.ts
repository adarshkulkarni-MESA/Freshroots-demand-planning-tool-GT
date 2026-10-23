import { createClient } from "@libsql/client";
import { neon } from "@neondatabase/serverless";

function isPostgresUrl(url: string) {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

export interface RawExecResult {
  rows: Record<string, unknown>[];
  lastInsertRowid?: bigint;
}
export type RawExecInput = string | { sql: string; args?: unknown[] };

export interface RawClient {
  execute(opts: RawExecInput): Promise<RawExecResult>;
}

function makeNeonClient(url: string): RawClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sql = neon(url) as any;
  return {
    async execute(opts: RawExecInput): Promise<RawExecResult> {
      const { raw, args } = typeof opts === "string"
        ? { raw: opts, args: [] as unknown[] }
        : { raw: opts.sql, args: opts.args ?? [] };
      let i = 0;
      const pgSql = raw.replace(/\?/g, () => `$${++i}`);
      const isInsert = /^\s*INSERT/i.test(pgSql);
      const finalSql = isInsert && !/RETURNING/i.test(pgSql)
        ? pgSql.replace(/;?\s*$/, " RETURNING id")
        : pgSql;
      const rows = (await sql(finalSql, args)) as Record<string, unknown>[];
      const lastInsertRowid = isInsert && rows.length > 0 && rows[0].id != null
        ? BigInt(rows[0].id as number)
        : undefined;
      return { rows, lastInsertRowid };
    },
  };
}

let _client: RawClient | null = null;

export function getClient(): RawClient {
  if (!_client) {
    const url = process.env.DATABASE_URL ?? "file:./freshroots.db";
    if (isPostgresUrl(url)) {
      _client = makeNeonClient(url);
    } else {
      // Libsql client satisfies RawClient interface
      _client = createClient({ url }) as unknown as RawClient;
    }
  }
  return _client;
}
