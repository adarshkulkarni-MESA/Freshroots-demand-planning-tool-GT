// One-time script to seed the Neon database.
// Run: node scripts/seed-neon.mjs
import { neon } from "@neondatabase/serverless";

const NEON_URL = process.env.DATABASE_URL;
if (!NEON_URL || !NEON_URL.startsWith("postgresql://")) {
  console.error("Set DATABASE_URL to the Neon postgresql:// connection string");
  process.exit(1);
}
const sql = neon(NEON_URL);

const DISTRIBUTORS = [
  ["DIST001", "NutriFlow Distributors", "Maharashtra", "Active"],
  ["DIST002", "GrainPath Logistics", "Maharashtra", "Active"],
  ["DIST003", "PeakSource Supply", "Karnataka", "Active"],
  ["DIST004", "Meridian Trade Co.", "Gujarat", "Active"],
];
const SKUS = [
  ["SKU001","Freshroots Mango Drink 200ml","Beverage","Low",500,"Units","DIST001"],
  ["SKU002","Freshroots Oats Cookies 150g","Snack","Low",200,"Units","DIST001"],
  ["SKU003","Freshroots Brown Rice 1kg","Staple","Low",300,"Units","DIST002"],
  ["SKU004","Freshroots Almond Milk 500ml","Dairy Alt","High",150,"Units","DIST002"],
  ["SKU005","Freshroots Mixed Nuts 100g","Snack","Low",150,"Units","DIST003"],
  ["SKU006","Freshroots Quinoa 500g","Staple","Low",100,"Units","DIST003"],
  ["SKU007","Freshroots Coconut Water 330ml","Beverage","High",400,"Units","DIST001"],
  ["SKU008","Freshroots Granola Bar 40g","Snack","Low",300,"Units","DIST002"],
  ["SKU009","Freshroots Chia Seeds 200g","Staple","Low",80,"Units","DIST003"],
  ["SKU010","Freshroots Apple Cider Vinegar 500ml","Condiment","Low",60,"Units","DIST004"],
  ["SKU011","Freshroots Multigrain Bread 400g","Staple","High",500,"Units","DIST004"],
  ["SKU012","Freshroots Herbal Tea 25 bags","Beverage","Low",150,"Units","DIST004"],
  ["SKU013","Freshroots Peanut Butter 300g","Condiment","Low",120,"Units","DIST001"],
  ["SKU014","Freshroots Dark Chocolate 80g","Snack","Low",200,"Units","DIST002"],
  ["SKU015","Freshroots Honey 500g","Condiment","Low",80,"Units","DIST003"],
];
const INVENTORY = [
  ["SKU001",900],["SKU002",1200],["SKU003",820],["SKU004",180],["SKU005",600],
  ["SKU006",1100],["SKU007",620],["SKU008",950],["SKU009",400],["SKU010",260],
  ["SKU011",460],["SKU012",480],["SKU013",180],["SKU014",620],["SKU015",360],
];
const CALENDAR = [
  [2025,1,"2025-01",0],[2025,3,"2025-03",1],[2025,10,"2025-10",1],[2025,11,"2025-11",1],
  [2026,3,"2026-03",1],[2026,10,"2026-10",1],[2026,11,"2026-11",1],[2026,12,"2026-12",0],
];
const WEEKLY_SALES = [
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
];

async function run() {
  console.log("Seeding Neon database...");
  for (const [id, name, region, status] of DISTRIBUTORS) {
    await sql`INSERT INTO distributors (distributor_id, name, region, status) VALUES (${id}, ${name}, ${region}, ${status}) ON CONFLICT (distributor_id) DO NOTHING`;
  }
  console.log("✓ Distributors");

  for (const [sid, sname, cat, perish, qty, uom, dist] of SKUS) {
    await sql`INSERT INTO skus (sku_id, sku_name, category, perishability, standard_reorder_qty, unit_of_measure, distributor_id) VALUES (${sid}, ${sname}, ${cat}, ${perish}, ${qty}, ${uom}, ${dist}) ON CONFLICT (sku_id) DO NOTHING`;
  }
  console.log("✓ SKUs");

  for (const [yr, mo, ym, fest] of CALENDAR) {
    await sql`INSERT INTO calendar_months (year, month, year_month, is_festival_month) VALUES (${yr}, ${mo}, ${ym}, ${fest}) ON CONFLICT (year_month) DO NOTHING`;
  }
  console.log("✓ Calendar");

  const [logRow] = await sql`INSERT INTO import_logs (file_type, filename, row_count, status) VALUES ('seed', 'initial_seed', 270, 'success') RETURNING id`;
  const importId = logRow.id;

  for (const [sid, units] of INVENTORY) {
    await sql`INSERT INTO inventory_snapshots (sku_id, location, units_on_hand, as_of_date, import_id) VALUES (${sid}, 'Pune Central Warehouse', ${units}, '2026-10-19', ${importId})`;
  }
  console.log("✓ Inventory");

  for (const [sid, wk, sold] of WEEKLY_SALES) {
    await sql`INSERT INTO weekly_sales (sku_id, week_label, units_sold, import_id) VALUES (${sid}, ${wk}, ${sold}, ${importId}) ON CONFLICT (sku_id, week_label) DO NOTHING`;
  }
  console.log("✓ Weekly Sales (240 rows)");

  await sql`INSERT INTO audit_events (event_type, actor, entity_type, payload_json) VALUES ('data_seeded', 'system', 'import', '{"source":"initial_seed","rows":270}')`;
  console.log("✓ Audit event");
  console.log("Seed complete!");
}
run().catch(console.error);
