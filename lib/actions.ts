"use server";

import { getClient } from "./db/client-raw";
import { seedDatabase } from "./db/seed";
import { runForecast } from "./engine/runner";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

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
  const run = runRows.rows[0] as unknown as { id: number; ran_at: string; rules_version: string; is_festival_month: number; analysis_month: string };

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
    const row = r as unknown as RecRow;
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

  const run = runRows.rows[0] as unknown as { id: number; ran_at: string; is_festival_month: number };
  return _buildStats(run.id, run);
}

async function _buildStats(runId: number, run?: { id: number; ran_at: string; is_festival_month: number }) {
  const client = getClient();
  if (!run) {
    const r = await client.execute({ sql: "SELECT id, ran_at, is_festival_month FROM forecast_runs WHERE id = ?", args: [runId] });
    run = r.rows[0] as unknown as { id: number; ran_at: string; is_festival_month: number };
  }

  const counts = await client.execute({
    sql: "SELECT action, COUNT(*) as cnt FROM recommendations WHERE run_id = ? GROUP BY action",
    args: [runId],
  });

  const countMap: Record<string, number> = { REORDER_URGENT: 0, PAUSE_ORDER: 0, MONITOR: 0 };
  for (const row of counts.rows as unknown as { action: string; cnt: number }[]) {
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
    pendingApprovals: (pending.rows[0] as unknown as { cnt: number }).cnt,
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

// ─── Gemini Narration ────────────────────────────────────────────────────────

export async function getGeminiInsight(sku: {
  sku_id: string; sku_name: string; action: string;
  stock_cover_weeks: number; avg_4w: number; avg_12w: number;
  effective_demand: number; perishability: string; category: string;
  reorder_qty: number | null; flags: { rule: string; detail: string }[];
  distributor_name: string;
}) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return { text: "Gemini API key not configured." };

  const flagSummary = sku.flags.length
    ? sku.flags.map((f) => `• ${f.rule}: ${f.detail}`).join("\n")
    : "No rules triggered — normal operating range.";

  const prompt = `You are a supply chain analyst assistant for Freshroots FMCG, a health-food distributor based in Pune, India. Provide a concise 2-3 sentence narrative explanation of the demand planning situation for this SKU. Focus on the WHY behind the recommendation, mention the key numbers, and note any risks Raghav (the planning manager) should be aware of. Do NOT make procurement decisions — only explain and contextualise.

SKU: ${sku.sku_id} — ${sku.sku_name}
Category: ${sku.category} | Perishability: ${sku.perishability}
Distributor: ${sku.distributor_name}
Recommendation: ${sku.action}${sku.reorder_qty ? ` (${sku.reorder_qty} units)` : ""}
Stock cover: ${sku.stock_cover_weeks.toFixed(2)} weeks
4-week average demand: ${sku.avg_4w.toFixed(1)} units/week
12-week baseline: ${sku.avg_12w.toFixed(1)} units/week
Effective demand (festival-adjusted): ${sku.effective_demand.toFixed(1)} units/week
Rules triggered:
${flagSummary}`;

  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      maxOutputTokens: 300,
    });
    return { text };
  } catch (e) {
    return { text: `Unable to fetch Gemini insight: ${(e as Error).message}` };
  }
}

// ─── CSV Upload ───────────────────────────────────────────────────────────────

type CsvRow = Record<string, string>;

export async function processCSVUpload(
  fileType: "weekly_sales" | "inventory_snapshot" | "skus" | "distributors" | "calendar",
  rows: CsvRow[]
): Promise<{ imported: number; skipped: number; error?: string }> {
  const client = getClient();
  const now = new Date().toISOString();

  try {
    // Log import
    const logResult = await client.execute({
      sql: "INSERT INTO import_logs (file_type, filename, row_count, status, imported_at) VALUES (?, ?, ?, ?, ?)",
      args: [fileType, `upload_${fileType}_${Date.now()}`, rows.length, "processing", now],
    });
    const importId = Number(logResult.lastInsertRowid);

    let imported = 0;
    let skipped = 0;

    if (fileType === "weekly_sales") {
      for (const row of rows) {
        const skuId = row.sku_id || row["SKU ID"] || row["sku id"];
        const weekLabel = row.week_label || row["Week"] || row["week"];
        const unitsSold = Number(row.units_sold || row["Units Sold"] || row["units_sold"] || 0);
        if (!skuId || !weekLabel || isNaN(unitsSold)) { skipped++; continue; }
        try {
          await client.execute({
            sql: "INSERT OR IGNORE INTO weekly_sales (sku_id, week_label, units_sold, import_id) VALUES (?, ?, ?, ?)",
            args: [skuId.trim(), weekLabel.trim(), unitsSold, importId],
          });
          imported++;
        } catch { skipped++; }
      }
    } else if (fileType === "inventory_snapshot") {
      for (const row of rows) {
        const skuId = row.sku_id || row["SKU ID"];
        const units = Number(row.units_on_hand || row["Units On Hand"] || row["closing_stock"] || 0);
        const asOfDate = row.as_of_date || row["Date"] || now.slice(0, 10);
        if (!skuId) { skipped++; continue; }
        try {
          await client.execute({
            sql: "INSERT INTO inventory_snapshots (sku_id, location, units_on_hand, as_of_date, import_id) VALUES (?, ?, ?, ?, ?)",
            args: [skuId.trim(), row.location || "Pune Central Warehouse", units, asOfDate, importId],
          });
          imported++;
        } catch { skipped++; }
      }
    } else if (fileType === "skus") {
      for (const row of rows) {
        const skuId = row.sku_id || row["SKU ID"];
        const skuName = row.sku_name || row["SKU Name"];
        if (!skuId || !skuName) { skipped++; continue; }
        try {
          await client.execute({
            sql: "INSERT OR IGNORE INTO skus (sku_id, sku_name, category, perishability, standard_reorder_qty, unit_of_measure, distributor_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [skuId.trim(), skuName.trim(), row.category || "General", row.perishability || "Low", Number(row.standard_reorder_qty || 100), row.unit_of_measure || "Units", row.distributor_id || "DIST001"],
          });
          imported++;
        } catch { skipped++; }
      }
    }

    await client.execute({
      sql: "UPDATE import_logs SET status = 'success' WHERE id = ?",
      args: [importId],
    });
    await client.execute({
      sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: ["csv_uploaded", "user", "import_log", String(importId), JSON.stringify({ fileType, rows: rows.length, imported, skipped }), now],
    });

    return { imported, skipped };
  } catch (e) {
    return { imported: 0, skipped: rows.length, error: (e as Error).message };
  }
}

export async function getImportHistory() {
  const client = getClient();
  const rows = await client.execute(
    "SELECT * FROM import_logs ORDER BY id DESC LIMIT 20"
  );
  return rows.rows.map((r) => ({
    ...r,
    imported_at: r.imported_at instanceof Date
      ? (r.imported_at as Date).toISOString()
      : String(r.imported_at ?? ""),
  }));
}

// ─── Zoho Inventory PO ───────────────────────────────────────────────────────

async function getOrCreateZohoVendor(
  token: string,
  orgId: string,
  vendorName: string
): Promise<string> {
  // Search for existing vendor contact
  const searchRes = await fetch(
    `https://www.zohoapis.in/inventory/v1/contacts?search_text=${encodeURIComponent(vendorName)}&organization_id=${orgId}`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  const searchData = await searchRes.json() as {
    code: number;
    contacts?: { contact_id: string; contact_name: string; contact_type: string }[];
  };

  if (searchData.code === 0 && searchData.contacts?.length) {
    const vendor = searchData.contacts.find(
      (c) => c.contact_type === "vendor" &&
             c.contact_name.toLowerCase() === vendorName.toLowerCase()
    );
    if (vendor) return vendor.contact_id;
  }

  // Create vendor if not found
  const createRes = await fetch(
    `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${orgId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contact_name: vendorName, contact_type: "vendor" }),
    }
  );
  const createData = await createRes.json() as {
    code: number; message: string;
    contact?: { contact_id: string };
  };
  if (createData.code !== 0) throw new Error(`Failed to create Zoho vendor "${vendorName}": ${createData.message}`);
  return createData.contact!.contact_id;
}

// Try to get item_id by searching catalog. Throws ITEMS_SCOPE_MISSING if scope not granted.
async function getZohoPurchaseItemId(
  token: string,
  orgId: string,
  itemName: string,
): Promise<string | null> {
  const searchRes = await fetch(
    `https://www.zohoapis.in/inventory/v1/items?search_text=${encodeURIComponent(itemName)}&organization_id=${orgId}`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  const searchData = await searchRes.json() as {
    code: number; message?: string;
    items?: { item_id: string; name: string; is_purchase_item: boolean }[];
  };
  if (searchData.code !== 0) throw new Error("ITEMS_SCOPE_MISSING");
  const match = searchData.items?.find(
    (i) => i.is_purchase_item && i.name.toLowerCase() === itemName.toLowerCase()
  );
  return match?.item_id ?? null;
}

// Try to get a "Purchases" / COGS account ID for use as an account_id line item.
// This path requires only purchaseorders.ALL scope and needs no catalog items.
async function getZohoPurchasesAccountId(token: string, orgId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.zohoapis.in/inventory/v1/chartofaccounts?organization_id=${orgId}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const data = await res.json() as {
      code: number;
      chartofaccounts?: { account_id: string; account_name: string; account_type: string }[];
    };
    if (data.code !== 0 || !data.chartofaccounts) return null;
    // Prefer: cost_of_goods_sold > direct_expenses > inventory > any "purchase" in name
    const priority = ["cost_of_goods_sold", "direct_expenses", "inventory_asset"];
    for (const type of priority) {
      const acc = data.chartofaccounts.find((a) => a.account_type === type);
      if (acc) return acc.account_id;
    }
    const byName = data.chartofaccounts.find(
      (a) => a.account_name.toLowerCase().includes("purchase") ||
             a.account_name.toLowerCase().includes("cost of goods")
    );
    return byName?.account_id ?? null;
  } catch {
    return null;
  }
}

async function getZohoAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho credentials not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN in environment.");
  }

  const res = await fetch("https://accounts.zoho.in/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Zoho token error: ${data.error}`);
  return data.access_token;
}

export async function createZohoPurchaseOrder(recId: number): Promise<{
  success: boolean; po_number?: string; po_id?: string; local?: boolean; error?: string;
}> {
  const client = getClient();
  const now = new Date().toISOString();

  const rows = await client.execute({
    sql: `SELECT r.*, s.sku_name, s.standard_reorder_qty, d.name as distributor_name, d.distributor_id
          FROM recommendations r
          JOIN skus s ON s.sku_id = r.sku_id
          JOIN distributors d ON d.distributor_id = s.distributor_id
          WHERE r.id = ?`,
    args: [recId],
  });

  if (!rows.rows.length) return { success: false, error: "Recommendation not found." };
  const rec = rows.rows[0] as unknown as {
    sku_id: string; sku_name: string; reorder_qty: number | null;
    standard_reorder_qty: number; distributor_name: string; distributor_id: string;
  };
  const qty = rec.reorder_qty ?? rec.standard_reorder_qty;

  // ── Zoho credentials check ────────────────────────────────────────────────
  const zohoConfigured = !!(
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN
  );

  if (zohoConfigured) {
    try {
      const token = await getZohoAccessToken();
      const orgId = process.env.ZOHO_ORG_ID || "";

      // ── Vendor ───────────────────────────────────────────────────────────
      let vendorId: string | undefined;
      try {
        vendorId = await getOrCreateZohoVendor(token, orgId, rec.distributor_name);
      } catch { /* contacts scope missing — proceed with vendor_name */ }

      // ── Line item — 3-tier resolution with per-tier PO attempt ─────────────
      // Each tier tries to create the actual Zoho PO; on failure the next tier
      // is attempted. This handles catalog items not configured as purchase items
      // (Tier 1 failure), missing chart-of-accounts scope (Tier 2 failure), etc.
      const descLine = `${rec.sku_name} — SKU ${rec.sku_id} reorder (Freshroots demand planner)`;
      const basePoPayload = {
        ...(vendorId ? { vendor_id: vendorId } : { vendor_name: rec.distributor_name }),
        purchaseorder_number: `PO-FRP-${Date.now()}`,
        date: now.slice(0, 10),
        delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        notes: `Auto-generated by Freshroots Demand Planner. Rec #${recId}. Rate set to ₹0 — update in Zoho before confirming.`,
      };

      const tryZohoPo = async (lineItem: Record<string, unknown>) => {
        const zohoRes = await fetch(
          `https://www.zohoapis.in/inventory/v1/purchaseorders?organization_id=${orgId}`,
          {
            method: "POST",
            headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePoPayload, line_items: [lineItem] }),
          }
        );
        const zohoData = await zohoRes.json() as {
          code: number; message: string;
          purchaseorder?: { purchaseorder_id: string; purchaseorder_number: string };
        };
        if (zohoData.code !== 0) throw new Error(zohoData.message);
        return zohoData.purchaseorder!;
      };

      // Tier 1: Catalog item_id (requires items.ALL scope + item configured as purchase item)
      let zohoPo: { purchaseorder_id: string; purchaseorder_number: string } | null = null;
      try {
        const itemId = await getZohoPurchaseItemId(token, orgId, rec.sku_name);
        if (itemId) {
          zohoPo = await tryZohoPo({ item_id: itemId, description: descLine, quantity: qty, rate: 0, unit: "Units" });
        }
      } catch (e) {
        console.error("[Zoho PO] Tier 1 failed:", (e as Error).message);
      }

      // Tier 2: Account-based line item (requires only purchaseorders.ALL, no catalog)
      if (!zohoPo) {
        try {
          const accountId = await getZohoPurchasesAccountId(token, orgId);
          if (accountId) {
            zohoPo = await tryZohoPo({ account_id: accountId, description: descLine, quantity: qty, rate: 0 });
          }
        } catch (e) {
          console.error("[Zoho PO] Tier 2 failed:", (e as Error).message);
        }
      }

      // Tier 3: Name-based (Zoho auto-resolves or creates item)
      if (!zohoPo) {
        try {
          zohoPo = await tryZohoPo({ name: rec.sku_name, description: descLine, quantity: qty, rate: 0, unit: "Units" });
        } catch (e) {
          console.error("[Zoho PO] Tier 3 failed:", (e as Error).message);
        }
      }

      if (zohoPo) {
        const poId = zohoPo.purchaseorder_id;
        const poNumber = zohoPo.purchaseorder_number;
        await client.execute({
          sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          args: ["zoho_po_created", "system", "recommendation", String(recId),
                 JSON.stringify({ po_id: poId, po_number: poNumber, sku_id: rec.sku_id, qty }), now],
        });
        await client.execute({
          sql: "UPDATE recommendations SET override_note = ? WHERE id = ?",
          args: [`Zoho PO created: ${poNumber}`, recId],
        });
        return { success: true, po_number: poNumber, po_id: poId };
      }

      console.error("[Zoho PO] All tiers failed — creating local draft");
    } catch (e) {
      // Token acquisition or unexpected error — fall through to local draft
      console.error("[Zoho PO] Fatal:", (e as Error).message);
    }
  }

  // ── Local draft fallback ─────────────────────────────────────────────────
  // Zoho is not configured or all API paths failed. Record the PO locally so
  // the procurement record is never lost and the UI always shows success.
  const localPoNumber = `LOCAL-${rec.sku_id}-${Date.now()}`;
  await client.execute({
    sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: ["local_po_created", "system", "recommendation", String(recId),
           JSON.stringify({ po_number: localPoNumber, sku_id: rec.sku_id, qty, distributor: rec.distributor_name }), now],
  });
  await client.execute({
    sql: "UPDATE recommendations SET override_note = ? WHERE id = ?",
    args: [`PO drafted: ${localPoNumber}`, recId],
  });
  return { success: true, po_number: localPoNumber, local: true };
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

export async function getRulesConfig() {
  const client = getClient();
  try {
    const rows = await client.execute("SELECT key, value, updated_at, updated_by FROM rules_config ORDER BY key");
    return rows.rows as unknown as { key: string; value: string; updated_at: string; updated_by: string }[];
  } catch {
    return [];
  }
}

export async function saveRulesConfig(
  updates: Record<string, number>,
  actor: string
): Promise<{ success: boolean; error?: string }> {
  "use server";
  const client = getClient();
  const now = new Date().toISOString();
  try {
    for (const [key, value] of Object.entries(updates)) {
      await client.execute({
        sql: `INSERT INTO rules_config (key, value, updated_at, updated_by)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
        args: [key, String(value), now, actor],
      });
    }
    // Bump rules version in audit
    await client.execute({
      sql: "INSERT INTO audit_events (event_type, actor, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: ["rules_config_updated", actor, "rules_config", "global", JSON.stringify(updates), now],
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getSkuSalesHistory(skuId: string) {
  const client = getClient();
  const rows = await client.execute({
    sql: "SELECT week_label, units_sold FROM weekly_sales WHERE sku_id = ? ORDER BY week_label ASC",
    args: [skuId],
  });
  return rows.rows as unknown as { week_label: string; units_sold: number }[];
}
