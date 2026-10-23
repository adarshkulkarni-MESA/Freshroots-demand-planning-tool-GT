"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, PauseCircle, CheckCircle, AlertCircle } from "lucide-react";

type Rec = {
  id: number; sku_id: string; sku_name: string; action: string;
  reorder_qty: number | null; stock_cover_weeks: number; avg_4w: number; avg_12w: number;
  effective_demand: number; perishability: string; category: string;
  distributor_name: string; approval_status: string;
  flags: { rule: string; detail: string }[];
};

const ACTION_CONFIG = {
  REORDER_URGENT: { label: "Reorder Urgent", icon: AlertTriangle, bg: "bg-red-100 text-red-700", row: "bg-red-50" },
  PAUSE_ORDER: { label: "Pause Order", icon: PauseCircle, bg: "bg-amber-100 text-amber-700", row: "bg-amber-50" },
  MONITOR: { label: "Monitor", icon: CheckCircle, bg: "bg-teal-100 text-teal-700", row: "" },
};

export function RecommendationsTable({ recs }: { recs: Rec[] }) {
  const [filter, setFilter] = useState<string>("ALL");

  const displayed = filter === "ALL" ? recs : recs.filter((r) => r.action === filter);

  const counts = {
    REORDER_URGENT: recs.filter((r) => r.action === "REORDER_URGENT").length,
    PAUSE_ORDER: recs.filter((r) => r.action === "PAUSE_ORDER").length,
    MONITOR: recs.filter((r) => r.action === "MONITOR").length,
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "ALL", label: `All (${recs.length})` },
          { key: "REORDER_URGENT", label: `Reorder Urgent (${counts.REORDER_URGENT})` },
          { key: "PAUSE_ORDER", label: `Pause Order (${counts.PAUSE_ORDER})` },
          { key: "MONITOR", label: `Monitor (${counts.MONITOR})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              filter === key
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">SKU</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Reorder Qty</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock Cover</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">4w Avg</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">12w Avg</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Flags</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((rec) => {
              const cfg = ACTION_CONFIG[rec.action as keyof typeof ACTION_CONFIG] ?? ACTION_CONFIG.MONITOR;
              const Icon = cfg.icon;
              const isBorderline = rec.flags.some((f) => f.detail.includes("BORDERLINE"));
              return (
                <tr key={rec.id} className={`border-b border-slate-100 hover:bg-slate-50 ${cfg.row}`}>
                  <td className="px-4 py-3">
                    <Link href={`/explorer?sku=${rec.sku_id}`} className="hover:underline">
                      <div className="font-medium text-slate-900">{rec.sku_id}</div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-48 truncate">{rec.sku_name}</div>
                      {rec.perishability === "High" && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded mt-0.5 inline-block">Perishable</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${cfg.bg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>
                    {isBorderline && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <AlertCircle className="w-3 h-3" /> Borderline
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {rec.reorder_qty ? <span className="font-semibold text-slate-900">{rec.reorder_qty}</span> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={`font-medium ${rec.stock_cover_weeks < 6 ? "text-red-600" : rec.stock_cover_weeks > 14 ? "text-amber-600" : "text-slate-700"}`}>
                      {rec.stock_cover_weeks.toFixed(2)}w
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{rec.avg_4w.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{rec.avg_12w.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rec.flags.map((f, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded" title={f.detail}>
                          {f.rule}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      rec.approval_status === "approved" ? "bg-green-100 text-green-700" :
                      rec.approval_status === "rejected" ? "bg-red-100 text-red-700" :
                      rec.action === "MONITOR" ? "bg-slate-100 text-slate-500" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {rec.action === "MONITOR" ? "N/A" : rec.approval_status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
