import { THRESHOLDS, RULES_VERSION } from "@/lib/engine/rules";

export default function RulesPage() {
  const rules = [
    {
      id: 1,
      name: "High Demand Signal",
      condition: `4w_avg > 12w_avg × ${THRESHOLDS.HIGH_DEMAND_RATIO}`,
      action: `Reorder at ${THRESHOLDS.HIGH_DEMAND_REORDER_MULT}× standard qty`,
      note: "Uses raw averages — festival uplift not applied for this check",
    },
    {
      id: 2,
      name: "Stockout Risk",
      condition: `stock_cover < ${THRESHOLDS.STOCKOUT_WEEKS} weeks`,
      action: "REORDER URGENT at standard qty",
      note: "Coverage uses festival-uplifted effective demand as denominator",
    },
    {
      id: 3,
      name: "Overstock Risk",
      condition: `stock_cover > ${THRESHOLDS.OVERSTOCK_WEEKS} weeks`,
      action: "PAUSE ORDER",
      note: "Festival uplift reduces apparent coverage, making overstock harder to trigger during festival months",
    },
    {
      id: 4,
      name: "Festival Month Uplift",
      condition: "Analysis month is Oct, Nov, or Mar",
      action: `Add ${THRESHOLDS.FESTIVAL_UPLIFT * 100}% of 12w_avg to effective demand baseline`,
      note: "Applied before Rules 2 & 3 coverage checks, NOT to Rule 1 high-demand comparison",
    },
    {
      id: 5,
      name: "Perishable Override",
      condition: "Perishability = High",
      action: `Min cover: ${THRESHOLDS.PERISH_MIN_WEEKS}w · Max cover: ${THRESHOLDS.PERISH_MAX_WEEKS}w`,
      note: "Highest priority — overrides Rules 1–3. Evaluated first.",
    },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Rules & Configuration</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-slate-500">Raghav's 5 Rules</span>
          <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded">v{RULES_VERSION}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        Rule changes create a new version record and audit event. No silent edits permitted.
        To update thresholds, contact the system administrator.
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {rule.id}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{rule.name}</div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Condition</div>
                    <code className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{rule.condition}</code>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Action</div>
                    <code className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-xs">{rule.action}</code>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">{rule.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
