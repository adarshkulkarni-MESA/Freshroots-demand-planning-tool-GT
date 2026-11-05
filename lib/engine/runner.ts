import { getClient } from "../db/client-raw";
import { evaluateSku, THRESHOLDS, RULES_VERSION, type SkuInput } from "./rules";

interface SalesRow { sku_id: string; week_label: string; units_sold: number }
interface InvRow { sku_id: string; units_on_hand: number }
interface SkuRow { sku_id: string; perishability: string; standard_reorder_qty: number }
interface CalRow { is_festival_month: number }

function sortWeeks(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Load runtime threshold overrides from rules_config table (falls back to code defaults if table missing or empty)
async function loadRulesConfig(): Promise<typeof THRESHOLDS> {
  const client = getClient();
  try {
    const rows = await client.execute("SELECT key, value FROM rules_config");
    const overrides: Record<string, number> = {};
    for (const row of rows.rows as unknown as { key: string; value: string }[]) {
      const n = parseFloat(row.value);
      if (!isNaN(n)) overrides[row.key] = n;
    }
    return { ...THRESHOLDS, ...overrides } as typeof THRESHOLDS;
  } catch {
    return THRESHOLDS;
  }
}

export async function runForecast(): Promise<number> {
  const client = getClient();
  const now = new Date().toISOString();
  // Dynamic analysis month from current date
  const analysisMonth = now.slice(0, 7);

  const thresholds = await loadRulesConfig();

  // Check festival month in calendar; default to false if month not seeded
  const calRows = await client.execute({
    sql: "SELECT is_festival_month FROM calendar_months WHERE year_month = ?",
    args: [analysisMonth],
  });
  const isFestival = calRows.rows.length > 0 && (calRows.rows[0] as unknown as CalRow).is_festival_month === 1;

  // Load all sales — sort per SKU, use rolling window
  const salesRows = await client.execute("SELECT sku_id, week_label, units_sold FROM weekly_sales");
  const salesMap: Record<string, SalesRow[]> = {};
  for (const row of salesRows.rows as unknown as SalesRow[]) {
    if (!salesMap[row.sku_id]) salesMap[row.sku_id] = [];
    salesMap[row.sku_id].push(row);
  }
  for (const skuId in salesMap) {
    salesMap[skuId].sort((a, b) => sortWeeks(a.week_label, b.week_label));
  }

  // Load latest inventory per SKU
  const invRows = await client.execute(
    "SELECT sku_id, units_on_hand FROM inventory_snapshots ORDER BY as_of_date DESC"
  );
  const invMap: Record<string, number> = {};
  for (const row of invRows.rows as unknown as InvRow[]) {
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

  // Run engine for each SKU using a rolling window of the most recent weeks
  for (const row of skuRows.rows as unknown as SkuRow[]) {
    const skuId = row.sku_id;
    const allWeeks = salesMap[skuId] ?? [];

    if (allWeeks.length < 4) continue; // need at least 4 weeks of data

    // Rolling window: last 4 weeks = recent, prior 12 = baseline
    const recent = allWeeks.slice(-4);
    const baseline = allWeeks.slice(-16, -4); // up to 12 weeks before the recent 4

    const sales4w = recent.map(w => w.units_sold);

    // Pad baseline to 12 weeks if fewer are available (use 4w avg as filler)
    const avg4wFill = sales4w.reduce((a, b) => a + b, 0) / sales4w.length;
    const baselinePadded = baseline.length >= 12
      ? baseline.slice(-12).map(w => w.units_sold)
      : [
          ...Array(12 - baseline.length).fill(Math.round(avg4wFill)),
          ...baseline.map(w => w.units_sold),
        ];

    const input: SkuInput = {
      skuId,
      perishability: row.perishability as "High" | "Low",
      standardReorderQty: row.standard_reorder_qty,
      unitsOnHand: invMap[skuId] ?? 0,
      sales12w: baselinePadded,
      sales4w,
      isFestivalMonth: isFestival,
      thresholds,
    };

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
    args: ["forecast_run", "system", "forecast_run", String(runId), JSON.stringify({ rulesVersion: RULES_VERSION, isFestival, analysisMonth }), now],
  });

  return runId;
}
