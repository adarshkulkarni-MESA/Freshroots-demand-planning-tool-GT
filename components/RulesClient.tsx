"use client";

import { useState } from "react";
import { Shield, Save, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { THRESHOLDS, RULES_VERSION } from "@/lib/engine/rules";
import { saveRulesConfig } from "@/lib/actions";

type RuleRow = { key: string; value: string; updated_at: string; updated_by: string };

const THRESHOLD_META: Record<string, { label: string; description: string; unit: string; min: number; max: number; step: number }> = {
  HIGH_DEMAND_RATIO:       { label: "High Demand Ratio",         description: "4w avg must exceed 12w avg × this factor to trigger high-demand signal", unit: "×", min: 1.0, max: 3.0, step: 0.05 },
  HIGH_DEMAND_REORDER_MULT:{ label: "High Demand Reorder Mult",  description: "Reorder quantity multiplier when high-demand signal is active",           unit: "×", min: 1.0, max: 3.0, step: 0.1  },
  STOCKOUT_WEEKS:          { label: "Stockout Threshold",        description: "Stock cover below this triggers REORDER URGENT",                           unit: "wk", min: 1, max: 20, step: 0.5 },
  OVERSTOCK_WEEKS:         { label: "Overstock Threshold",       description: "Stock cover above this triggers PAUSE ORDER",                              unit: "wk", min: 4, max: 52, step: 1   },
  FESTIVAL_UPLIFT:         { label: "Festival Uplift",           description: "Percentage added to 12w baseline demand during festival months",           unit: "%", min: 0, max: 100, step: 5   },
  PERISH_MIN_WEEKS:        { label: "Perishable Min Cover",      description: "Minimum stock cover for high-perishability SKUs before urgent reorder",    unit: "wk", min: 0.5, max: 10, step: 0.5 },
  PERISH_MAX_WEEKS:        { label: "Perishable Max Cover",      description: "Maximum stock cover for high-perishability SKUs before pause order",       unit: "wk", min: 1, max: 12, step: 0.5 },
};

function displayValue(key: string, val: number): string {
  if (key === "FESTIVAL_UPLIFT") return (val * 100).toFixed(0);
  return String(val);
}

function parseValue(key: string, raw: string): number {
  const n = parseFloat(raw);
  if (key === "FESTIVAL_UPLIFT") return n / 100;
  return n;
}

export function RulesClient({
  savedConfig,
  rulesVersion,
}: {
  savedConfig: RuleRow[];
  rulesVersion: string;
}) {
  const defaults = THRESHOLDS as Record<string, number>;

  const initValues: Record<string, string> = {};
  for (const key of Object.keys(THRESHOLD_META)) {
    const saved = savedConfig.find((r) => r.key === key);
    const raw = saved ? parseFloat(saved.value) : defaults[key];
    initValues[key] = displayValue(key, raw as number);
  }

  const [values, setValues] = useState<Record<string, string>>(initValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const hasChanges = Object.keys(THRESHOLD_META).some(
    (k) => values[k] !== initValues[k]
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    const updates: Record<string, number> = {};
    for (const key of Object.keys(THRESHOLD_META)) {
      updates[key] = parseValue(key, values[key]);
    }
    const result = await saveRulesConfig(updates, "Raghav Kulkarni");
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error ?? "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-teal-600" />
          <div>
            <span className="font-semibold text-slate-700 text-sm">Active Thresholds</span>
            <span className="ml-2 bg-teal-100 text-teal-700 text-xs font-mono px-2 py-0.5 rounded">v{rulesVersion}</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            hasChanges && !saving
              ? "bg-teal-600 hover:bg-teal-700 text-white"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Every save creates an immutable audit event. Changes take effect on the next forecast run.
      </div>

      {/* Threshold grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(THRESHOLD_META).map(([key, meta]) => {
          const defaultVal = displayValue(key, defaults[key]);
          const changed = values[key] !== initValues[key];
          return (
            <div key={key} className={`bg-white rounded-xl border p-4 ${changed ? "border-teal-400 ring-1 ring-teal-200" : "border-slate-200"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{meta.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{meta.description}</div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono ml-2 shrink-0">{meta.unit}</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="number"
                  min={meta.unit === "%" ? meta.min : meta.min}
                  max={meta.unit === "%" ? meta.max : meta.max}
                  step={meta.unit === "%" ? meta.step : meta.step}
                  value={values[key]}
                  onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                {changed && (
                  <span className="text-xs text-slate-400">
                    was <span className="font-mono">{defaultVal}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Config history */}
      {savedConfig.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showHistory ? "Hide" : "Show"} saved overrides ({savedConfig.length})
          </button>
          {showHistory && (
            <div className="mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2 text-slate-500 font-semibold">Key</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-semibold">Value</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-semibold">Updated by</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-semibold">At</th>
                  </tr>
                </thead>
                <tbody>
                  {savedConfig.map((row) => (
                    <tr key={row.key} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 font-mono text-slate-700">{row.key}</td>
                      <td className="px-4 py-2 font-mono text-teal-700">{row.value}</td>
                      <td className="px-4 py-2 text-slate-600">{row.updated_by}</td>
                      <td className="px-4 py-2 text-slate-400">{row.updated_at.slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
