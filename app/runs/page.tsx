import { getForecastRuns } from "@/lib/actions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await getForecastRuns() as Record<string, unknown>[];

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Forecast Runs & History</h1>
        <p className="text-slate-500 text-sm mt-1">Immutable run records — every calculation is traceable</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Run</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Rules</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Festival</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">SKUs</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={String(run.id)} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-700">#{String(run.id)}</td>
                <td className="px-4 py-3 text-slate-700">
                  {run.ran_at ? format(new Date(String(run.ran_at)), "dd MMM yyyy, HH:mm") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded">v{String(run.rules_version)}</span>
                </td>
                <td className="px-4 py-3">
                  {run.is_festival_month ? (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">Active</span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{String(run.sku_count)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">{String(run.status)}</span>
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No runs yet. Use the Overview page to trigger a run.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
