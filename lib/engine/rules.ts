export const RULES_VERSION = "1.0.0";

// Raghav's thresholds — versioned, never changed silently
export const THRESHOLDS = {
  HIGH_DEMAND_RATIO: 1.20,        // 4w avg > 12w avg × this
  HIGH_DEMAND_REORDER_MULT: 1.5,  // reorder at this × standard qty
  STOCKOUT_WEEKS: 6,              // stock cover below this → reorder
  OVERSTOCK_WEEKS: 14,            // stock cover above this → pause
  FESTIVAL_UPLIFT: 0.25,          // 25% uplift to 12w baseline
  PERISH_MAX_WEEKS: 4,            // high-perishability max cover
  PERISH_MIN_WEEKS: 3,            // high-perishability min cover
} as const;

export type RecommendationAction = "REORDER_URGENT" | "PAUSE_ORDER" | "MONITOR";

export interface RuleFlag {
  rule: string;
  detail: string;
}

export interface SkuInput {
  skuId: string;
  perishability: "High" | "Low";
  standardReorderQty: number;
  unitsOnHand: number;
  sales12w: number[];  // oldest first, 12 values (padded if fewer available)
  sales4w: number[];   // 4 values (most recent)
  isFestivalMonth: boolean;
  thresholds?: typeof THRESHOLDS; // runtime overrides from rules_config
}

export interface SkuResult {
  skuId: string;
  action: RecommendationAction;
  reorderQty: number | null;
  stockCoverWeeks: number;
  avg12w: number;
  avg4w: number;
  effectiveDemand: number;
  isFestivalMonth: boolean;
  flags: RuleFlag[];
  rulesVersion: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function evaluateSku(input: SkuInput): SkuResult {
  const { skuId, perishability, standardReorderQty, unitsOnHand, sales12w, sales4w, isFestivalMonth } = input;
  const T = input.thresholds ?? THRESHOLDS;
  const flags: RuleFlag[] = [];

  // Compute raw averages
  const avg12w = round2(sales12w.reduce((a, b) => a + b, 0) / 12);
  const avg4w = round2(sales4w.reduce((a, b) => a + b, 0) / 4);

  // Rule 4: Festival uplift applied to baseline for coverage check (not for high-demand signal)
  const festivalAdd = isFestivalMonth ? round2(avg12w * T.FESTIVAL_UPLIFT) : 0;
  const effectiveDemand = round2(avg12w + festivalAdd);

  if (isFestivalMonth) {
    flags.push({ rule: "Rule 4", detail: `Festival month: +${festivalAdd.toFixed(1)} units/week uplift (${Math.round(T.FESTIVAL_UPLIFT * 100)}% of 12w avg ${avg12w})` });
  }

  const stockCoverWeeks = round2(effectiveDemand > 0 ? unitsOnHand / effectiveDemand : 999);

  // Rule 5: Perishable override — highest priority
  if (perishability === "High") {
    if (stockCoverWeeks < T.PERISH_MIN_WEEKS) {
      flags.push({ rule: "Rule 5", detail: `Perishable stockout: ${stockCoverWeeks}w cover < ${T.PERISH_MIN_WEEKS}w minimum` });
      return {
        skuId, action: "REORDER_URGENT", reorderQty: standardReorderQty,
        stockCoverWeeks, avg12w, avg4w, effectiveDemand, isFestivalMonth, flags, rulesVersion: RULES_VERSION,
      };
    }
    if (stockCoverWeeks > T.PERISH_MAX_WEEKS) {
      const isBorderline = stockCoverWeeks <= T.PERISH_MAX_WEEKS + 0.5;
      flags.push({ rule: "Rule 5", detail: `Perishable overstock: ${stockCoverWeeks}w cover > ${T.PERISH_MAX_WEEKS}w maximum${isBorderline ? " (BORDERLINE — review carefully)" : ""}` });
      return {
        skuId, action: "PAUSE_ORDER", reorderQty: null,
        stockCoverWeeks, avg12w, avg4w, effectiveDemand, isFestivalMonth, flags, rulesVersion: RULES_VERSION,
      };
    }
    flags.push({ rule: "Rule 5", detail: `Perishable cover ${stockCoverWeeks}w within ${T.PERISH_MIN_WEEKS}–${T.PERISH_MAX_WEEKS}w range` });
  }

  // Rule 3: Overstock check
  if (stockCoverWeeks > T.OVERSTOCK_WEEKS) {
    flags.push({ rule: "Rule 3", detail: `Overstock: ${stockCoverWeeks}w cover > ${T.OVERSTOCK_WEEKS}w threshold` });
    return {
      skuId, action: "PAUSE_ORDER", reorderQty: null,
      stockCoverWeeks, avg12w, avg4w, effectiveDemand, isFestivalMonth, flags, rulesVersion: RULES_VERSION,
    };
  }

  // Rule 2: Stockout risk
  if (stockCoverWeeks < T.STOCKOUT_WEEKS) {
    let qty = standardReorderQty;
    flags.push({ rule: "Rule 2", detail: `Stockout risk: ${stockCoverWeeks}w cover < ${T.STOCKOUT_WEEKS}w threshold` });

    // Rule 1: High demand modifier on top of stockout
    if (avg4w > avg12w * T.HIGH_DEMAND_RATIO) {
      qty = Math.ceil(standardReorderQty * T.HIGH_DEMAND_REORDER_MULT);
      flags.push({ rule: "Rule 1", detail: `High demand: 4w avg ${avg4w} > 12w avg ${avg12w} × ${T.HIGH_DEMAND_RATIO} (${round2(avg12w * T.HIGH_DEMAND_RATIO)}). Reorder at ${T.HIGH_DEMAND_REORDER_MULT}× = ${qty}` });
    }

    return {
      skuId, action: "REORDER_URGENT", reorderQty: qty,
      stockCoverWeeks, avg12w, avg4w, effectiveDemand, isFestivalMonth, flags, rulesVersion: RULES_VERSION,
    };
  }

  // Rule 1: High demand (standalone, no stockout)
  if (avg4w > avg12w * T.HIGH_DEMAND_RATIO) {
    const qty = Math.ceil(standardReorderQty * T.HIGH_DEMAND_REORDER_MULT);
    flags.push({ rule: "Rule 1", detail: `High demand: 4w avg ${avg4w} > 12w avg ${avg12w} × ${T.HIGH_DEMAND_RATIO}. Reorder at ${T.HIGH_DEMAND_REORDER_MULT}× = ${qty}` });
    return {
      skuId, action: "REORDER_URGENT", reorderQty: qty,
      stockCoverWeeks, avg12w, avg4w, effectiveDemand, isFestivalMonth, flags, rulesVersion: RULES_VERSION,
    };
  }

  return {
    skuId, action: "MONITOR", reorderQty: null,
    stockCoverWeeks, avg12w, avg4w, effectiveDemand, isFestivalMonth, flags, rulesVersion: RULES_VERSION,
  };
}
