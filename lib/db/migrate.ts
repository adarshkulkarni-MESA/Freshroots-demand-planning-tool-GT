import { getClient } from "./client-raw";

function isPostgresUrl(url: string) {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

const SQLITE_TABLES = `
CREATE TABLE IF NOT EXISTS distributors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distributor_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS skus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id TEXT NOT NULL UNIQUE,
  sku_name TEXT NOT NULL,
  category TEXT NOT NULL,
  perishability TEXT NOT NULL DEFAULT 'Low',
  standard_reorder_qty INTEGER NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'Units',
  distributor_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success'
);

CREATE TABLE IF NOT EXISTS weekly_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id TEXT NOT NULL,
  week_label TEXT NOT NULL,
  units_sold INTEGER NOT NULL,
  import_id INTEGER
);

CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id TEXT NOT NULL,
  location TEXT NOT NULL,
  units_on_hand INTEGER NOT NULL,
  as_of_date TEXT NOT NULL,
  import_id INTEGER
);

CREATE TABLE IF NOT EXISTS calendar_months (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year_month TEXT NOT NULL,
  is_festival_month INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forecast_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at TEXT NOT NULL,
  rules_version TEXT NOT NULL DEFAULT '1.0.0',
  data_hash TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  is_festival_month INTEGER NOT NULL DEFAULT 0,
  analysis_month TEXT
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  sku_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reorder_qty INTEGER,
  stock_cover_weeks REAL,
  avg_4w REAL,
  avg_12w REAL,
  effective_demand REAL,
  flags_json TEXT DEFAULT '[]',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  override_note TEXT,
  approved_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  entity_type TEXT,
  entity_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);
`;

export async function runMigrations() {
  const url = process.env.DATABASE_URL ?? "file:./freshroots.db";
  const isPg = isPostgresUrl(url);
  // PostgreSQL uses SERIAL for auto-increment; SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT
  const CREATE_TABLES = isPg
    ? SQLITE_TABLES.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY")
    : SQLITE_TABLES;
  const client = getClient();
  const statements = CREATE_TABLES.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.execute(stmt);
  }
}
