import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const distributors = sqliteTable("distributors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  distributorId: text("distributor_id").notNull().unique(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  status: text("status").notNull().default("Active"),
});

export const skus = sqliteTable("skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuId: text("sku_id").notNull().unique(),
  skuName: text("sku_name").notNull(),
  category: text("category").notNull(),
  perishability: text("perishability").notNull().default("Low"),
  standardReorderQty: integer("standard_reorder_qty").notNull(),
  unitOfMeasure: text("unit_of_measure").notNull().default("Units"),
  distributorId: text("distributor_id").notNull(),
});

export const importLogs = sqliteTable("import_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileType: text("file_type").notNull(),
  filename: text("filename").notNull(),
  importedAt: text("imported_at").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  status: text("status").notNull().default("success"),
});

export const weeklySales = sqliteTable("weekly_sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuId: text("sku_id").notNull(),
  weekLabel: text("week_label").notNull(),
  unitsSold: integer("units_sold").notNull(),
  importId: integer("import_id"),
});

export const inventorySnapshots = sqliteTable("inventory_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuId: text("sku_id").notNull(),
  location: text("location").notNull(),
  unitsOnHand: integer("units_on_hand").notNull(),
  asOfDate: text("as_of_date").notNull(),
  importId: integer("import_id"),
});

export const calendarMonths = sqliteTable("calendar_months", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  yearMonth: text("year_month").notNull(),
  isFestivalMonth: integer("is_festival_month").notNull().default(0),
});

export const forecastRuns = sqliteTable("forecast_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ranAt: text("ran_at").notNull(),
  rulesVersion: text("rules_version").notNull().default("1.0.0"),
  dataHash: text("data_hash"),
  status: text("status").notNull().default("completed"),
  isFestivalMonth: integer("is_festival_month").notNull().default(0),
  analysisMonth: text("analysis_month"),
});

export const recommendations = sqliteTable("recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: integer("run_id").notNull(),
  skuId: text("sku_id").notNull(),
  action: text("action").notNull(),
  reorderQty: integer("reorder_qty"),
  stockCoverWeeks: real("stock_cover_weeks"),
  avg4w: real("avg_4w"),
  avg12w: real("avg_12w"),
  effectiveDemand: real("effective_demand"),
  flagsJson: text("flags_json").default("[]"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  approvedBy: text("approved_by"),
  overrideNote: text("override_note"),
  approvedAt: text("approved_at"),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(),
  actor: text("actor").notNull().default("system"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  payloadJson: text("payload_json"),
  createdAt: text("created_at").notNull(),
});
