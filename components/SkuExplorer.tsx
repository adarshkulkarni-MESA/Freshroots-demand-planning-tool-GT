"use client";

import { useState } from "react";
import { AlertTriangle, PauseCircle, CheckCircle, Sparkles } from "lucide-react";
import { getGeminiInsight } from "@/lib/actions";

type Rec = {
  id: number; sku_id: string; sku_name: string; action: string;
  reorder_qty: number | null; stock_cover_weeks: number; avg_4w: number; avg_12w: number;
  effective_demand: number; perishability: string; category: string;
  distributor_name: string; flags: { rule: string; detail: string }[];
};

export function SkuExplorer({ recs }: { recs: Rec[] }) {
  const [selectedId, setSelectedId] = useState<string>(recs[0]?.sku_id ?? "");
  const [geminiText, setGeminiText] = useState<Record<string, string>>({});
  const [geminiLoading, setGeminiLoading] = useState<Record<string, boolean>>({});
  const selected = recs.find((r) => r.sku_id === selectedId) ?? recs[0];

  async function fetchGemini(rec: Rec) {
    if (geminiText[rec.sku_id]) return; // already fetched
    setGeminiLoading((p) => ({ ...p, [rec.sku_id]: true }));
    const { text } = await getGeminiInsight(rec);
    setGeminiText((p) => ({ ...p, [rec.sku_id]: text }));
    setGeminiLoading((p) => ({ ...p, [rec.sku_id]: false }));
  }

  return (
    <div className="flex gap-6">
      {/* SKU list */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {recs.map((rec) => {
            const active = rec.sku_id === selectedId;
            return (
              <button
                key={rec.sku_id}
                onClick={() => setSelectedId(rec.sku_id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${
                  active ? "bg-teal-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-semibold ${active ? "text-teal-700" : "text-slate-600"}`}>{rec.sku_id}</span>
                  {rec.action === "REORDER_URGENT" && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  {rec.action === "PAUSE_ORDER" && <PauseCircle className="w-3.5 h-3.5 text-amber-500" />}
                  {rec.action === "MONITOR" && <CheckCircle className="w-3.5 h-3.5 text-teal-400" />}
                </div>
                <div className={`text-xs mt-0.5 truncate ${active ? "text-teal-600" : "text-slate-500"}`}>
                  {rec.sku_name.replace("Freshroots ", "")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-slate-500 font-mono">{selected.sku_id}</div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selected.sku_name}</h2>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{selected.category}</span>
                  {selected.perishability === "High" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">High Perishability</span>
                  )}
                  <span className="text-xs text-slate-500">{selected.distributor_name}</span>
                </div>
              </div>
              <div className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                selected.action === "REORDER_URGENT" ? "bg-red-100 text-red-700" :
                selected.action === "PAUSE_ORDER" ? "bg-amber-100 text-amber-700" :
                "bg-teal-100 text-teal-700"
              }`}>
                {selected.action.replace("_", " ")}
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Stock Cover</div>
                <div className={`text-xl font-bold mt-1 ${selected.stock_cover_weeks < 4 ? "text-red-600" : selected.stock_cover_weeks < 6 ? "text-orange-600" : selected.stock_cover_weeks > 14 ? "text-amber-600" : "text-teal-700"}`}>
                  {selected.stock_cover_weeks.toFixed(2)}w
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">4w Average</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{selected.avg_4w.toFixed(1)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">12w Baseline</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{selected.avg_12w.toFixed(1)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Eff. Demand/wk</div>
                <div className="text-xl font-bold text-amber-600 mt-1">{selected.effective_demand.toFixed(1)}</div>
              </div>
            </div>

            {selected.reorder_qty && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">Suggested Reorder Quantity</span>
                <span className="text-2xl font-bold text-red-700">{selected.reorder_qty} units</span>
              </div>
            )}

            {/* Rule trace */}
            <div>
              <h3 className="font-semibold text-slate-700 text-sm mb-2">Rule-by-Rule Trace</h3>
              {selected.flags.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No rules triggered — normal operating range.</p>
              ) : (
                <div className="space-y-2">
                  {selected.flags.map((f, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                      <div className="text-xs font-semibold text-slate-500 mb-0.5">{f.rule}</div>
                      <div className="text-sm text-slate-700">{f.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gemini Insight */}
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-slate-700 text-sm">Gemini Insight</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Contextual — not authoritative</span>
                </div>
                {!geminiText[selected.sku_id] && !geminiLoading[selected.sku_id] && (
                  <button
                    onClick={() => fetchGemini(selected)}
                    className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                  >
                    <Sparkles className="w-3 h-3" /> Ask Gemini
                  </button>
                )}
              </div>
              {geminiLoading[selected.sku_id] && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg px-4 py-3">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Generating insight from Gemini…
                </div>
              )}
              {geminiText[selected.sku_id] && (
                <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-slate-700 leading-relaxed">{geminiText[selected.sku_id]}</p>
                  <button
                    onClick={() => setGeminiText((p) => { const n = { ...p }; delete n[selected.sku_id]; return n; })}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    Refresh insight
                  </button>
                </div>
              )}
              {!geminiText[selected.sku_id] && !geminiLoading[selected.sku_id] && (
                <p className="text-xs text-slate-400 italic">Click &ldquo;Ask Gemini&rdquo; for an AI-generated plain-language explanation of this SKU&apos;s demand situation.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
