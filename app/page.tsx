import { getOverviewStats } from "@/lib/actions";
import { RunForecastButton } from "@/components/RunForecastButton";
import { format } from "date-fns";
import Link from "next/link";
import { AlertTriangle, PauseCircle, CheckCircle, Clock, Zap, Package, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const stats = await getOverviewStats();

  const ranAtFormatted = stats.ranAt
    ? format(new Date(stats.ranAt), "dd MMM yyyy, HH:mm")
    : "—";

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm shadow-slate-100/80">
        <div className="px-8 py-5 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Demand Planning</h1>
              <p className="text-slate-400 mt-0.5 text-xs">
                Freshroots FMCG · Pune Central Warehouse · W43 analysis (Oct 19, 2026)
              </p>
            </div>
            <RunForecastButton />
          </div>
        </div>
      </div>

      <div className="px-8 py-7 max-w-5xl">
        {/* Festival month alert */}
        {stats.isFestivalMonth && (
          <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl px-5 py-4 shadow-sm shadow-amber-100/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-900">Festival Month Active — October 2026</div>
              <div className="text-xs text-amber-600 mt-0.5">+25% demand uplift applied to all coverage calculations</div>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total SKUs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <Package className="w-[18px] h-[18px] text-slate-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">{stats.totalSkus}</div>
            <div className="text-[11px] text-slate-400 mt-1.5 font-semibold uppercase tracking-wider">Total SKUs</div>
          </div>

          {/* Reorder Urgent */}
          <Link
            href="/recommendations?filter=REORDER_URGENT"
            className="group bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 shadow-lg shadow-red-200/60 hover:shadow-xl hover:shadow-red-200/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
              <AlertTriangle className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="text-3xl font-bold text-white tabular-nums">{stats.reorderUrgent}</div>
            <div className="text-[11px] text-red-100 mt-1.5 font-semibold uppercase tracking-wider">Reorder Urgent</div>
          </Link>

          {/* Pause Order */}
          <Link
            href="/recommendations?filter=PAUSE_ORDER"
            className="group bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 shadow-lg shadow-amber-200/60 hover:shadow-xl hover:shadow-amber-200/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
              <PauseCircle className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="text-3xl font-bold text-white tabular-nums">{stats.pauseOrder}</div>
            <div className="text-[11px] text-amber-100 mt-1.5 font-semibold uppercase tracking-wider">Pause Order</div>
          </Link>

          {/* Monitor */}
          <Link
            href="/recommendations?filter=MONITOR"
            className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg shadow-emerald-200/60 hover:shadow-xl hover:shadow-emerald-200/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
              <CheckCircle className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="text-3xl font-bold text-white tabular-nums">{stats.monitor}</div>
            <div className="text-[11px] text-emerald-100 mt-1.5 font-semibold uppercase tracking-wider">Monitor</div>
          </Link>
        </div>

        {/* Pending approvals + Last run */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending approvals */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                <Clock className="w-[17px] h-[17px] text-white" />
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">Pending Approvals</h2>
            </div>
            <div className="text-5xl font-bold text-slate-900 tabular-nums leading-none">{stats.pendingApprovals}</div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Items needing review before procurement handoff
            </p>
            {stats.pendingApprovals > 0 && (
              <Link
                href="/review"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                Go to Review <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          {/* Last forecast run */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <History className="w-[17px] h-[17px] text-slate-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">Last Forecast Run</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Run ID</span>
                <span className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">#{stats.runId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Completed</span>
                <span className="text-slate-700 text-xs font-medium">{ranAtFormatted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Rules Version</span>
                <span className="font-mono text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">v1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Festival Uplift</span>
                <span className={`text-xs font-semibold ${stats.isFestivalMonth ? "text-amber-600" : "text-slate-400"}`}>
                  {stats.isFestivalMonth ? "Active (+25%)" : "Inactive"}
                </span>
              </div>
            </div>
            <Link
              href="/runs"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              View all runs <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
