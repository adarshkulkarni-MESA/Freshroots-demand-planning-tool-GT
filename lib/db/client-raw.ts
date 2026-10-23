import { createClient } from "@libsql/client";

let _client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!_client) {
    const url = process.env.DATABASE_URL ?? "file:./freshroots.db";
    _client = createClient({ url });
  }
  return _client;
}
