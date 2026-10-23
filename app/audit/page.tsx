import { getAuditEvents } from "@/lib/actions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await getAuditEvents(100);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity & Audit Log</h1>
        <p className="text-slate-500 text-sm mt-1">
          Immutable event record · Every upload, run, approval, override, and config change
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Event</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Actor</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Entity</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev: Record<string, unknown>) => (
              <tr key={ev.id as number} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    String(ev.event_type).includes("approved") ? "bg-green-100 text-green-700" :
                    String(ev.event_type).includes("rejected") ? "bg-red-100 text-red-700" :
                    String(ev.event_type).includes("run") ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {String(ev.event_type).replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{String(ev.actor)}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                  {ev.entity_type ? `${ev.entity_type} #${ev.entity_id}` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {ev.created_at ? format(new Date(String(ev.created_at)), "dd MMM HH:mm:ss") : "—"}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No events yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
