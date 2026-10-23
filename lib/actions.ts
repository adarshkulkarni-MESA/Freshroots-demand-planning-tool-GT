"use server";

import { getClient } from "./db/client-raw";
import { seedDatabase } from "./db/seed";
import { runForecast } from "./engine/runner";

export async function ensureSeeded() {
  await seedDatabase();
}

export async function triggerForecastRun(): Promise<{ runId: number }> {
  await ensureSeeded();
  const runId = await runForecast();
  return { runId };
}

interface RecRow {
  id: number; run_id: number; sku_id: string; action: string; reorder_qty: number | null;
  stock_cover_weeks: number; avg_4w: number; avg_12w: number; effective_demand: number;
  flags_json: string; approval_status: string; approved_by: string | null;
  override_note: string | null; approved_at: string | null;
  sku_name: string; category: string; perishability: string; standard_reorder_qty: number;
  distributor_name: string;
}

export async function getLatestRecommendations() {
  await ensureSeeded();
  const client = getClient();

  // Get latest run
  const runRows = await client.execute(
    "SELECT id, ran_at, rules_version, is_festival_month, analysis_month FROM forecast_runs ORDER BY id DESC LIMIT 1"
  );
  if (runRows.rows.length === 0) {
    const { runId } = await triggerForecastRun();
    return getRecommendationsByRun(runId);
  }
  const run = runRows.rows[0] as { id: number; ran_at: string; rules_version: string; is_festival_month: number; analysis_month: string };

  return getRecommendationsByRun(run.id);
}

export async function getRecommendationsByRun(runId: number) {
  const client = getClient();
  const rows = await client.execute({
    sql: `SELECT r.*, s.sku_name, s.category, s.perishability, s.standard_reorder_qty,
          d.name as distributor_name
          FROM recommendations r
          JOIN skus s ON s.sku_id = r.sku_id
          JOIN distributors d ON d.distributor_id = s.distributor_id
          WHERE r.run_id = ?
          ORDER BY
            CASE r.action WHEN 'REORDER_URGENT' THEN 1 WHEN 'PAUSE_ORDER' THEN 2 ELSE 3 END,
            r.stock_cover_weeks ASC`,
    args: [runId],
  });

  return rows.rows.map((r) => {
    const row = r as RecRow;
    return {
      ...row,
      flags: JSON.parse(row.flags_json || "[]") as { rule: string; detail: string }[],
    };
  });
}

export async function getOverviewStats() {
  await ensureSeeded();
  const client = getClient();

  const runRows = await client.execute(
    "SELECT id, ran_at, is_festival_month FROM forecast_runs ORDER BY id DESC LIMIT 1"
  );

  if (runRows.rows.length === 0) {
    const { runId } = await triggerForecastRun();
    return _buildStats(runId);
  }

  const run = runRows.rows[0] as { id: number; ran_at: string; is_festival_month: number };
  return _buildStats(run.id, run);
}

async function _buildStats(runId: number, run?: { id: number; ran_at: string; is_festival_month: number }) {
  const client = getClient();
  if (!run) {
    const r = await client.execute({ sql: "SELECT id, ran_at, is_festival_month FROM forecast_runs WHERE id = ?", args: [runId] });
    run = r.rows[0] as { id: number; ran_at: string; is_festival_month: number };
  }

  const counts = await client.execute({
    sql: "SELECT action, COUNT(*) as cnt FROM recommendations WHERE run_id = ? GROUP BY action",
    args: [runId],
  });

  const countMap: Record<string, number> = { REORDER_URGENT: 0, PAUSE_ORDER: 0, MONITOR: 0 };
  for (const row of counts.rows as { action: string; cnt: number }[]) {
    countMap[row.action] = row.cnt;
  }

  const pending = await client.execute({
    sql: "SELECT COUNT(*) as cnt FROM recommendations WHERE run_id = ? AND action != 'MONITOR' AND approval_status = 'pending'",
    args: [runId],
  });

  return {
    runId,
    ranAt: run.ran_at,
    isFestivalMonth: run.is_festival_month === 1,
    reorderUrgent: countMap.REORDER_URGENT,
    pauseOrder: countMap.PAUSE_ORDER,
    monitor: countMap.MONITOR,
    pendingApprovals: (pending.rows[0] as { cnt: number }).cnt,
    totalSkus: countMap.REORDER_URGENT + countMap.PAUSE_ORDER + countMap.MONITOR,
  };
}

export async function approveRecommendation(
  recId: number,
  approvedBy: string,
  overrideNote?: string
) {
  const client = getClient();
  const now = new Date().toISOString();
  await client.execute({
    sql: "UPDATE recommendations SET approval_status = 'approved', approved_by = ?, override_note = ?, approved_at = ? WHERE id = ?",
    args: [approvedBy, overrideNote ?? null, now, recId],
  });
  await client.execute({
    sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["recommendation_approved", approvedBy, "recommendation", String(recId), JSON.stringify({ overrideNote }), now],
  });
}

export async function rejectRecommendation(
  recId: number,
  rejectedBy: string,
  note: string
) {
  const client = getClient();
  const now = new Date().toISOString();
  await client.execute({
    sql: "UPDATE recommendations SET approval_status = 'rejected', approved_by = ?, override_note = ?, approved_at = ? WHERE id = ?",
    args: [rejectedBy, note, now, recId],
  });
  await client.execute({
    sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["recommendation_rejected", rejectedBy, "recommendation", String(recId), JSON.stringify({ note }), now],
  });
}

export async function getAuditEvents(limit = 50) {
  const client = getClient();
  const rows = await client.execute({
    sql: "SELECT * FROM audit_events ORDER BY id DESC LIMIT ?",
    args: [limit],
  });
  return rows.rows;
}

export async function getForecastRuns() {
  const client = getClient();
  const rows = await client.execute(
    "SELECT fr.*, COUNT(rec.id) as sku_count FROM forecast_runs fr LEFT JOIN recommendations rec ON rec.run_id = fr.id GROUP BY fr.id ORDER BY fr.id DESC LIMIT 20"
  );
  return rows.rows;
}

export async function getApprovedForProcurement(runId?: number) {
  const client = getClient();
  const sql = runId
    ? `SELECT r.*, s.sku_name, s.standard_reorder_qty, d.name as distributor_name, d.distributor_id
       FROM recommendations r
       JOIN skus s ON s.sku_id = r.sku_id
       JOIN distributors d ON d.distributor_id = s.distributor_id
       WHERE r.run_id = ? AND r.action = 'REORDER_URGENT' AND r.approval_status = 'approved'
       ORDER BY d.name, r.sku_id`
    : `SELECT r.*, s.sku_name, s.standard_reorder_qty, d.name as distributor_name, d.distributor_id
       FROM recommendations r
       JOIN skus s ON s.sku_id = r.sku_id
       JOIN distributors d ON d.distributor_id = s.distributor_id
       WHERE r.run_id = (SELECT MAX(id) FROM forecast_runs)
       AND r.action = 'REORDER_URGENT' AND r.approval_status = 'approved'
       ORDER BY d.name, r.sku_id`;

  const rows = await client.execute(runId ? { sql, args: [runId] } : sql);
  return rows.rows;
}
