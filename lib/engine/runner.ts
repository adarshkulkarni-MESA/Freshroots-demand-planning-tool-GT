import { getClient } from "../db/client-raw";
import { evaluateSku, RULES_VERSION, type SkuInput } from "./rules";

interface SalesRow { sku_id: string; week_label: string; units_sold: number }
interface InvRow { sku_id: string; units_on_hand: number }
interface SkuRow { sku_id: string; perishability: string; standard_reorder_qty: number }
interface CalRow { is_festival_month: number }

// ISO week sort: "2026-W27" < "2026-W28" etc.
function sortWeeks(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export async function runForecast(): Promise<number> {
  const client = getClient();
  const now = new Date().toISOString();
  const analysisMonth = "2026-10"; // current month from calendar

  // Check festival month
  const calRows = await client.execute({
    sql: "SELECT is_festival_month FROM calendar_months WHERE year_month = ?",
    args: [analysisMonth],
  });
  const isFestival = calRows.rows.length > 0 && (calRows.rows[0] as CalRow).is_festival_month === 1;

  // Load all sales — we'll window W27–W38 (12w) and W39–W42 (4w)
  const salesRows = await client.execute("SELECT sku_id, week_label, units_sold FROM weekly_sales");
  const salesMap: Record<string, SalesRow[]> = {};
  for (const row of salesRows.rows as SalesRow[]) {
    if (!salesMap[row.sku_id]) salesMap[row.sku_id] = [];
    salesMap[row.sku_id].push(row);
  }

  // Sort each SKU's weeks
  for (const skuId in salesMap) {
    salesMap[skuId].sort((a, b) => sortWeeks(a.week_label, b.week_label));
  }

  // Load latest inventory per SKU
  const invRows = await client.execute(
    "SELECT sku_id, units_on_hand FROM inventory_snapshots ORDER BY as_of_date DESC"
  );
  const invMap: Record<string, number> = {};
  for (const row of invRows.rows as InvRow[]) {
    if (!(row.sku_id in invMap)) invMap[row.sku_id] = row.units_on_hand;
  }

  // Load SKU master
  const skuRows = await client.execute(
    "SELECT sku_id, perishability, standard_reorder_qty FROM skus"
  );

  // Create forecast run record
  const runResult = await client.execute({
    sql: "INSERT INTO forecast_runs (ran_at, rules_version, status, is_festival_month, analysis_month) VALUES (?, ?, ?, ?, ?)",
    args: [now, RULES_VERSION, "completed", isFestival ? 1 : 0, analysisMonth],
  });
  const runId = Number(runResult.lastInsertRowid);

  // Run engine for each SKU
  for (const row of skuRows.rows as SkuRow[]) {
    const skuId = row.sku_id;
    const allWeeks = salesMap[skuId] ?? [];

    // Weeks W27–W38 = 12w baseline, W39–W42 = 4w recent
    const weeks12 = allWeeks.filter(w => w.week_label <= "2026-W38").slice(-12);
    const weeks4 = allWeeks.filter(w => w.week_label >= "2026-W39").slice(-4);

    const input: SkuInput = {
      skuId,
      perishability: row.perishability as "High" | "Low",
      standardReorderQty: row.standard_reorder_qty,
      unitsOnHand: invMap[skuId] ?? 0,
      sales12w: weeks12.map(w => w.units_sold),
      sales4w: weeks4.map(w => w.units_sold),
      isFestivalMonth: isFestival,
    };

    if (input.sales12w.length < 12 || input.sales4w.length < 4) continue;

    const result = evaluateSku(input);

    await client.execute({
      sql: `INSERT INTO recommendations
        (run_id, sku_id, action, reorder_qty, stock_cover_weeks, avg_4w, avg_12w, effective_demand, flags_json, approval_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        runId, skuId, result.action, result.reorderQty ?? null,
        result.stockCoverWeeks, result.avg4w, result.avg12w, result.effectiveDemand,
        JSON.stringify(result.flags), "pending",
      ],
    });
  }

  // Audit
  await client.execute({
    sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["forecast_run", "system", "forecast_run", String(runId), JSON.stringify({ rulesVersion: RULES_VERSION, isFestival }), now],
  });

  return runId;
}
