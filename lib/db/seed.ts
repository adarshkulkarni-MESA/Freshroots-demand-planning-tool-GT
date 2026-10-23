import { getClient } from "./client-raw";
import { runMigrations } from "./migrate";

const DISTRIBUTORS = [
  { distributor_id: "DIST001", name: "NutriFlow Distributors", region: "Maharashtra", status: "Active" },
  { distributor_id: "DIST002", name: "GrainPath Logistics", region: "Maharashtra", status: "Active" },
  { distributor_id: "DIST003", name: "PeakSource Supply", region: "Karnataka", status: "Active" },
  { distributor_id: "DIST004", name: "Meridian Trade Co.", region: "Gujarat", status: "Active" },
];

const SKUS = [
  { sku_id: "SKU001", sku_name: "Freshroots Mango Drink 200ml", category: "Beverage", perishability: "Low", standard_reorder_qty: 500, unit_of_measure: "Units", distributor_id: "DIST001" },
  { sku_id: "SKU002", sku_name: "Freshroots Oats Cookies 150g", category: "Snack", perishability: "Low", standard_reorder_qty: 200, unit_of_measure: "Units", distributor_id: "DIST001" },
  { sku_id: "SKU003", sku_name: "Freshroots Brown Rice 1kg", category: "Staple", perishability: "Low", standard_reorder_qty: 300, unit_of_measure: "Units", distributor_id: "DIST002" },
  { sku_id: "SKU004", sku_name: "Freshroots Almond Milk 500ml", category: "Dairy Alt", perishability: "High", standard_reorder_qty: 150, unit_of_measure: "Units", distributor_id: "DIST002" },
  { sku_id: "SKU005", sku_name: "Freshroots Mixed Nuts 100g", category: "Snack", perishability: "Low", standard_reorder_qty: 150, unit_of_measure: "Units", distributor_id: "DIST003" },
  { sku_id: "SKU006", sku_name: "Freshroots Quinoa 500g", category: "Staple", perishability: "Low", standard_reorder_qty: 100, unit_of_measure: "Units", distributor_id: "DIST003" },
  { sku_id: "SKU007", sku_name: "Freshroots Coconut Water 330ml", category: "Beverage", perishability: "High", standard_reorder_qty: 400, unit_of_measure: "Units", distributor_id: "DIST001" },
  { sku_id: "SKU008", sku_name: "Freshroots Granola Bar 40g", category: "Snack", perishability: "Low", standard_reorder_qty: 300, unit_of_measure: "Units", distributor_id: "DIST002" },
  { sku_id: "SKU009", sku_name: "Freshroots Chia Seeds 200g", category: "Staple", perishability: "Low", standard_reorder_qty: 80, unit_of_measure: "Units", distributor_id: "DIST003" },
  { sku_id: "SKU010", sku_name: "Freshroots Apple Cider Vinegar 500ml", category: "Condiment", perishability: "Low", standard_reorder_qty: 60, unit_of_measure: "Units", distributor_id: "DIST004" },
  { sku_id: "SKU011", sku_name: "Freshroots Multigrain Bread 400g", category: "Staple", perishability: "High", standard_reorder_qty: 500, unit_of_measure: "Units", distributor_id: "DIST004" },
  { sku_id: "SKU012", sku_name: "Freshroots Herbal Tea 25 bags", category: "Beverage", perishability: "Low", standard_reorder_qty: 150, unit_of_measure: "Units", distributor_id: "DIST004" },
  { sku_id: "SKU013", sku_name: "Freshroots Peanut Butter 300g", category: "Condiment", perishability: "Low", standard_reorder_qty: 120, unit_of_measure: "Units", distributor_id: "DIST001" },
  { sku_id: "SKU014", sku_name: "Freshroots Dark Chocolate 80g", category: "Snack", perishability: "Low", standard_reorder_qty: 200, unit_of_measure: "Units", distributor_id: "DIST002" },
  { sku_id: "SKU015", sku_name: "Freshroots Honey 500g", category: "Condiment", perishability: "Low", standard_reorder_qty: 80, unit_of_measure: "Units", distributor_id: "DIST003" },
];

const INVENTORY = [
  { sku_id: "SKU001", location: "Pune Central Warehouse", units_on_hand: 900, as_of_date: "2026-10-19" },
  { sku_id: "SKU002", location: "Pune Central Warehouse", units_on_hand: 1200, as_of_date: "2026-10-19" },
  { sku_id: "SKU003", location: "Pune Central Warehouse", units_on_hand: 820, as_of_date: "2026-10-19" },
  { sku_id: "SKU004", location: "Pune Central Warehouse", units_on_hand: 180, as_of_date: "2026-10-19" },
  { sku_id: "SKU005", location: "Pune Central Warehouse", units_on_hand: 600, as_of_date: "2026-10-19" },
  { sku_id: "SKU006", location: "Pune Central Warehouse", units_on_hand: 1100, as_of_date: "2026-10-19" },
  { sku_id: "SKU007", location: "Pune Central Warehouse", units_on_hand: 620, as_of_date: "2026-10-19" },
  { sku_id: "SKU008", location: "Pune Central Warehouse", units_on_hand: 950, as_of_date: "2026-10-19" },
  { sku_id: "SKU009", location: "Pune Central Warehouse", units_on_hand: 400, as_of_date: "2026-10-19" },
  { sku_id: "SKU010", location: "Pune Central Warehouse", units_on_hand: 260, as_of_date: "2026-10-19" },
  { sku_id: "SKU011", location: "Pune Central Warehouse", units_on_hand: 460, as_of_date: "2026-10-19" },
  { sku_id: "SKU012", location: "Pune Central Warehouse", units_on_hand: 480, as_of_date: "2026-10-19" },
  { sku_id: "SKU013", location: "Pune Central Warehouse", units_on_hand: 180, as_of_date: "2026-10-19" },
  { sku_id: "SKU014", location: "Pune Central Warehouse", units_on_hand: 620, as_of_date: "2026-10-19" },
  { sku_id: "SKU015", location: "Pune Central Warehouse", units_on_hand: 360, as_of_date: "2026-10-19" },
];

// Festival calendar for 2025-2026
const CALENDAR = [
  { year: 2025, month: 1, year_month: "2025-01", is_festival_month: 0 },
  { year: 2025, month: 2, year_month: "2025-02", is_festival_month: 0 },
  { year: 2025, month: 3, year_month: "2025-03", is_festival_month: 1 },
  { year: 2025, month: 4, year_month: "2025-04", is_festival_month: 0 },
  { year: 2025, month: 5, year_month: "2025-05", is_festival_month: 0 },
  { year: 2025, month: 6, year_month: "2025-06", is_festival_month: 0 },
  { year: 2025, month: 7, year_month: "2025-07", is_festival_month: 0 },
  { year: 2025, month: 8, year_month: "2025-08", is_festival_month: 0 },
  { year: 2025, month: 9, year_month: "2025-09", is_festival_month: 0 },
  { year: 2025, month: 10, year_month: "2025-10", is_festival_month: 1 },
  { year: 2025, month: 11, year_month: "2025-11", is_festival_month: 1 },
  { year: 2025, month: 12, year_month: "2025-12", is_festival_month: 0 },
  { year: 2026, month: 1, year_month: "2026-01", is_festival_month: 0 },
  { year: 2026, month: 2, year_month: "2026-02", is_festival_month: 0 },
  { year: 2026, month: 3, year_month: "2026-03", is_festival_month: 1 },
  { year: 2026, month: 4, year_month: "2026-04", is_festival_month: 0 },
  { year: 2026, month: 5, year_month: "2026-05", is_festival_month: 0 },
  { year: 2026, month: 6, year_month: "2026-06", is_festival_month: 0 },
  { year: 2026, month: 7, year_month: "2026-07", is_festival_month: 0 },
  { year: 2026, month: 8, year_month: "2026-08", is_festival_month: 0 },
  { year: 2026, month: 9, year_month: "2026-09", is_festival_month: 0 },
  { year: 2026, month: 10, year_month: "2026-10", is_festival_month: 1 },
  { year: 2026, month: 11, year_month: "2026-11", is_festival_month: 1 },
  { year: 2026, month: 12, year_month: "2026-12", is_festival_month: 0 },
];

// All 240 weekly sales rows W27-W42 2026
const WEEKLY_SALES_RAW = [
  ["SKU001","2026-W27",194],["SKU001","2026-W28",188],["SKU001","2026-W29",204],["SKU001","2026-W30",186],["SKU001","2026-W31",201],["SKU001","2026-W32",195],["SKU001","2026-W33",185],["SKU001","2026-W34",200],["SKU001","2026-W35",185],["SKU001","2026-W36",197],["SKU001","2026-W37",186],["SKU001","2026-W38",186],["SKU001","2026-W39",261],["SKU001","2026-W40",267],["SKU001","2026-W41",257],["SKU001","2026-W42",259],
  ["SKU002","2026-W27",86],["SKU002","2026-W28",91],["SKU002","2026-W29",86],["SKU002","2026-W30",83],["SKU002","2026-W31",91],["SKU002","2026-W32",78],["SKU002","2026-W33",89],["SKU002","2026-W34",82],["SKU002","2026-W35",80],["SKU002","2026-W36",79],["SKU002","2026-W37",82],["SKU002","2026-W38",89],["SKU002","2026-W39",80],["SKU002","2026-W40",86],["SKU002","2026-W41",86],["SKU002","2026-W42",83],
  ["SKU003","2026-W27",151],["SKU003","2026-W28",139],["SKU003","2026-W29",139],["SKU003","2026-W30",142],["SKU003","2026-W31",154],["SKU003","2026-W32",148],["SKU003","2026-W33",145],["SKU003","2026-W34",152],["SKU003","2026-W35",148],["SKU003","2026-W36",145],["SKU003","2026-W37",157],["SKU003","2026-W38",154],["SKU003","2026-W39",143],["SKU003","2026-W40",151],["SKU003","2026-W41",150],["SKU003","2026-W42",159],
  ["SKU004","2026-W27",82],["SKU004","2026-W28",77],["SKU004","2026-W29",86],["SKU004","2026-W30",75],["SKU004","2026-W31",78],["SKU004","2026-W32",83],["SKU004","2026-W33",75],["SKU004","2026-W34",79],["SKU004","2026-W35",74],["SKU004","2026-W36",82],["SKU004","2026-W37",83],["SKU004","2026-W38",80],["SKU004","2026-W39",84],["SKU004","2026-W40",77],["SKU004","2026-W41",82],["SKU004","2026-W42",81],
  ["SKU005","2026-W27",60],["SKU005","2026-W28",59],["SKU005","2026-W29",63],["SKU005","2026-W30",64],["SKU005","2026-W31",59],["SKU005","2026-W32",61],["SKU005","2026-W33",55],["SKU005","2026-W34",61],["SKU005","2026-W35",61],["SKU005","2026-W36",64],["SKU005","2026-W37",63],["SKU005","2026-W38",57],["SKU005","2026-W39",58],["SKU005","2026-W40",61],["SKU005","2026-W41",55],["SKU005","2026-W42",59],
  ["SKU006","2026-W27",37],["SKU006","2026-W28",37],["SKU006","2026-W29",37],["SKU006","2026-W30",41],["SKU006","2026-W31",37],["SKU006","2026-W32",38],["SKU006","2026-W33",39],["SKU006","2026-W34",42],["SKU006","2026-W35",37],["SKU006","2026-W36",39],["SKU006","2026-W37",40],["SKU006","2026-W38",42],["SKU006","2026-W39",42],["SKU006","2026-W40",42],["SKU006","2026-W41",38],["SKU006","2026-W42",39],
  ["SKU007","2026-W27",117],["SKU007","2026-W28",127],["SKU007","2026-W29",128],["SKU007","2026-W30",113],["SKU007","2026-W31",113],["SKU007","2026-W32",114],["SKU007","2026-W33",114],["SKU007","2026-W34",119],["SKU007","2026-W35",121],["SKU007","2026-W36",115],["SKU007","2026-W37",110],["SKU007","2026-W38",118],["SKU007","2026-W39",131],["SKU007","2026-W40",133],["SKU007","2026-W41",136],["SKU007","2026-W42",134],
  ["SKU008","2026-W27",110],["SKU008","2026-W28",112],["SKU008","2026-W29",113],["SKU008","2026-W30",102],["SKU008","2026-W31",117],["SKU008","2026-W32",114],["SKU008","2026-W33",116],["SKU008","2026-W34",115],["SKU008","2026-W35",108],["SKU008","2026-W36",108],["SKU008","2026-W37",103],["SKU008","2026-W38",112],["SKU008","2026-W39",102],["SKU008","2026-W40",102],["SKU008","2026-W41",104],["SKU008","2026-W42",104],
  ["SKU009","2026-W27",34],["SKU009","2026-W28",32],["SKU009","2026-W29",32],["SKU009","2026-W30",33],["SKU009","2026-W31",32],["SKU009","2026-W32",34],["SKU009","2026-W33",32],["SKU009","2026-W34",37],["SKU009","2026-W35",35],["SKU009","2026-W36",33],["SKU009","2026-W37",33],["SKU009","2026-W38",34],["SKU009","2026-W39",34],["SKU009","2026-W40",32],["SKU009","2026-W41",36],["SKU009","2026-W42",37],
  ["SKU010","2026-W27",24],["SKU010","2026-W28",24],["SKU010","2026-W29",23],["SKU010","2026-W30",23],["SKU010","2026-W31",24],["SKU010","2026-W32",24],["SKU010","2026-W33",26],["SKU010","2026-W34",23],["SKU010","2026-W35",23],["SKU010","2026-W36",26],["SKU010","2026-W37",25],["SKU010","2026-W38",23],["SKU010","2026-W39",25],["SKU010","2026-W40",23],["SKU010","2026-W41",25],["SKU010","2026-W42",26],
  ["SKU011","2026-W27",211],["SKU011","2026-W28",206],["SKU011","2026-W29",192],["SKU011","2026-W30",195],["SKU011","2026-W31",189],["SKU011","2026-W32",208],["SKU011","2026-W33",201],["SKU011","2026-W34",208],["SKU011","2026-W35",194],["SKU011","2026-W36",191],["SKU011","2026-W37",209],["SKU011","2026-W38",215],["SKU011","2026-W39",211],["SKU011","2026-W40",209],["SKU011","2026-W41",210],["SKU011","2026-W42",207],
  ["SKU012","2026-W27",52],["SKU012","2026-W28",55],["SKU012","2026-W29",53],["SKU012","2026-W30",50],["SKU012","2026-W31",50],["SKU012","2026-W32",53],["SKU012","2026-W33",52],["SKU012","2026-W34",56],["SKU012","2026-W35",59],["SKU012","2026-W36",54],["SKU012","2026-W37",58],["SKU012","2026-W38",59],["SKU012","2026-W39",62],["SKU012","2026-W40",60],["SKU012","2026-W41",59],["SKU012","2026-W42",59],
  ["SKU013","2026-W27",42],["SKU013","2026-W28",42],["SKU013","2026-W29",45],["SKU013","2026-W30",47],["SKU013","2026-W31",47],["SKU013","2026-W32",44],["SKU013","2026-W33",46],["SKU013","2026-W34",47],["SKU013","2026-W35",42],["SKU013","2026-W36",46],["SKU013","2026-W37",47],["SKU013","2026-W38",47],["SKU013","2026-W39",46],["SKU013","2026-W40",44],["SKU013","2026-W41",42],["SKU013","2026-W42",47],
  ["SKU014","2026-W27",68],["SKU014","2026-W28",73],["SKU014","2026-W29",75],["SKU014","2026-W30",68],["SKU014","2026-W31",68],["SKU014","2026-W32",75],["SKU014","2026-W33",72],["SKU014","2026-W34",66],["SKU014","2026-W35",65],["SKU014","2026-W36",66],["SKU014","2026-W37",74],["SKU014","2026-W38",73],["SKU014","2026-W39",75],["SKU014","2026-W40",78],["SKU014","2026-W41",79],["SKU014","2026-W42",78],
  ["SKU015","2026-W27",29],["SKU015","2026-W28",30],["SKU015","2026-W29",28],["SKU015","2026-W30",27],["SKU015","2026-W31",32],["SKU015","2026-W32",30],["SKU015","2026-W33",30],["SKU015","2026-W34",32],["SKU015","2026-W35",29],["SKU015","2026-W36",31],["SKU015","2026-W37",31],["SKU015","2026-W38",28],["SKU015","2026-W39",28],["SKU015","2026-W40",29],["SKU015","2026-W41",28],["SKU015","2026-W42",30],
] as [string, string, number][];

export async function seedDatabase() {
  const client = getClient();
  await runMigrations();

  // Check if already seeded
  const existing = await client.execute("SELECT COUNT(*) as cnt FROM skus");
  if ((existing.rows[0] as { cnt: number }).cnt > 0) return;

  const now = new Date().toISOString();

  // Insert distributors
  for (const d of DISTRIBUTORS) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO distributors (distributor_id, name, region, status) VALUES (?, ?, ?, ?)",
      args: [d.distributor_id, d.name, d.region, d.status],
    });
  }

  // Insert SKUs
  for (const s of SKUS) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO skus (sku_id, sku_name, category, perishability, standard_reorder_qty, unit_of_measure, distributor_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [s.sku_id, s.sku_name, s.category, s.perishability, s.standard_reorder_qty, s.unit_of_measure, s.distributor_id],
    });
  }

  // Insert calendar
  for (const c of CALENDAR) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO calendar_months (year, month, year_month, is_festival_month) VALUES (?, ?, ?, ?)",
      args: [c.year, c.month, c.year_month, c.is_festival_month],
    });
  }

  // Import log for seed
  const importResult = await client.execute({
    sql: "INSERT INTO import_logs (file_type, filename, imported_at, row_count, status) VALUES (?, ?, ?, ?, ?)",
    args: ["seed", "initial_seed", now, 15 + 240 + 15, "success"],
  });
  const importId = importResult.lastInsertRowid;

  // Insert inventory
  for (const inv of INVENTORY) {
    await client.execute({
      sql: "INSERT INTO inventory_snapshots (sku_id, location, units_on_hand, as_of_date, import_id) VALUES (?, ?, ?, ?, ?)",
      args: [inv.sku_id, inv.location, inv.units_on_hand, inv.as_of_date, importId],
    });
  }

  // Insert weekly sales
  for (const [skuId, weekLabel, unitsSold] of WEEKLY_SALES_RAW) {
    await client.execute({
      sql: "INSERT INTO weekly_sales (sku_id, week_label, units_sold, import_id) VALUES (?, ?, ?, ?)",
      args: [skuId, weekLabel, unitsSold, importId],
    });
  }

  // Audit event
  await client.execute({
    sql: "INSERT INTO audit_events (event_type, actor, entity_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)",
    args: ["data_seeded", "system", "import", JSON.stringify({ source: "initial_seed", rows: 270 }), now],
  });
}
