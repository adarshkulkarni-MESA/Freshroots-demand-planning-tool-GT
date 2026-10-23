import { getOverviewStats } from "@/lib/actions";
import { RunForecastButton } from "@/components/RunForecastButton";
import { format } from "date-fns";
import Link from "next/link";
import { AlertTriangle, PauseCircle, CheckCircle, Clock, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const stats = await getOverviewStats();

  const ranAtFormatted = stats.ranAt
    ? format(new Date(stats.ranAt), "dd MMM yyyy, HH:mm")
    : "—";

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Demand Planning Overview</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Freshroots FMCG · Pune Central Warehouse · W43 analysis (Oct 19, 2026)
            </p>
          </div>
          <RunForecastButton />
        </div>

        {stats.isFestivalMonth && (
          <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm font-medium text-amber-800">
              Festival Month Active (October 2026) — 25% demand uplift applied to all coverage calculations
            </span>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-3xl font-bold text-slate-900">{stats.totalSkus}</div>
          <div className="text-sm text-slate-500 mt-1">Total SKUs</div>
        </div>

        <Link href="/recommendations?filter=REORDER_URGENT" className="bg-red-50 rounded-xl border border-red-200 p-5 hover:border-red-300 transition-colors">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="text-3xl font-bold text-red-700">{stats.reorderUrgent}</div>
          </div>
          <div className="text-sm text-red-600 mt-1 font-medium">Reorder Urgent</div>
        </Link>

        <Link href="/recommendations?filter=PAUSE_ORDER" className="bg-amber-50 rounded-xl border border-amber-200 p-5 hover:border-amber-300 transition-colors">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-500" />
            <div className="text-3xl font-bold text-amber-700">{stats.pauseOrder}</div>
          </div>
          <div className="text-sm text-amber-600 mt-1 font-medium">Pause Order</div>
        </Link>

        <Link href="/recommendations?filter=MONITOR" className="bg-teal-50 rounded-xl border border-teal-200 p-5 hover:border-teal-300 transition-colors">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-500" />
            <div className="text-3xl font-bold text-teal-700">{stats.monitor}</div>
          </div>
          <div className="text-sm text-teal-600 mt-1 font-medium">Monitor</div>
        </Link>
      </div>

      {/* Pending Approvals + Run info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Pending Raghav Approvals</h2>
          </div>
          <div className="text-4xl font-bold text-slate-900">{stats.pendingApprovals}</div>
          <p className="text-sm text-slate-500 mt-2">
            Items needing review before procurement handoff
          </p>
          {stats.pendingApprovals > 0 && (
            <Link href="/review" className="mt-3 inline-block text-sm text-teal-600 font-medium hover:underline">
              Go to Review →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Last Forecast Run</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Run ID</span>
              <span className="font-mono text-slate-700">#{stats.runId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Completed</span>
              <span className="text-slate-700">{ranAtFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rules Version</span>
              <span className="font-mono text-teal-600">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Festival Uplift</span>
              <span className={stats.isFestivalMonth ? "text-amber-600 font-medium" : "text-slate-700"}>
                {stats.isFestivalMonth ? "Active (+25%)" : "Inactive"}
              </span>
            </div>
          </div>
          <Link href="/runs" className="mt-3 inline-block text-sm text-teal-600 font-medium hover:underline">
            View all runs →
          </Link>
        </div>
      </div>

      {/* Mandate progress */}
      <div className="bg-slate-900 rounded-xl p-6 text-white">
        <h2 className="font-bold text-lg mb-1">Deepa's 90-Day Mandate</h2>
        <p className="text-slate-400 text-sm mb-4">
          Streamline Raghav's weekly demand planning cycle. Remove repetitive calculation work. Preserve human judgment on exceptions.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-teal-400">400</div>
            <div className="text-xs text-slate-400 mt-1">Production SKUs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-400">1,200</div>
            <div className="text-xs text-slate-400 mt-1">Distributors (prod)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">MH + Goa</div>
            <div className="text-xs text-slate-400 mt-1">Territory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
