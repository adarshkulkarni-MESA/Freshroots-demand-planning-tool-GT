"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { format } from "date-fns";

type AuditEvent = {
  id: number;
  event_type: string;
  actor: string;
  entity_type: string | null;
  entity_id: string | null;
  payload_json: string | null;
  created_at: string;
};

const EVENT_TYPES = [
  "all",
  "forecast_run",
  "recommendation_approved",
  "recommendation_rejected",
  "zoho_po_created",
  "rules_config_updated",
  "csv_import",
];

function eventBadgeClass(type: string) {
  if (type.includes("approved")) return "bg-green-100 text-green-700";
  if (type.includes("rejected")) return "bg-red-100 text-red-700";
  if (type.includes("run")) return "bg-blue-100 text-blue-700";
  if (type.includes("zoho")) return "bg-emerald-100 text-emerald-700";
  if (type.includes("rules")) return "bg-purple-100 text-purple-700";
  if (type.includes("import")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function AuditClient({ events }: { events: AuditEvent[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const eventTypes = useMemo(() => {
    const seen = new Set(events.map((e) => e.event_type));
    return ["all", ...Array.from(seen).sort()];
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (typeFilter !== "all" && ev.event_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          ev.event_type.includes(q) ||
          ev.actor.toLowerCase().includes(q) ||
          (ev.entity_type ?? "").toLowerCase().includes(q) ||
          (ev.entity_id ?? "").toLowerCase().includes(q) ||
          (ev.payload_json ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, typeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, actors, entities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white appearance-none"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All event types" : t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center text-xs text-slate-400 px-2">
          {filtered.length} of {events.length} events
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Event</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Actor</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Entity</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Payload</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev) => {
              let payloadPreview = "";
              try {
                if (ev.payload_json) {
                  const p = JSON.parse(ev.payload_json) as Record<string, unknown>;
                  payloadPreview = Object.entries(p)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ");
                }
              } catch { /* skip malformed */ }
              return (
                <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${eventBadgeClass(ev.event_type)}`}>
                      {ev.event_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ev.actor}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {ev.entity_type ? `${ev.entity_type} #${ev.entity_id}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{payloadPreview || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {ev.created_at ? format(new Date(ev.created_at), "dd MMM HH:mm:ss") : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {events.length === 0 ? "No events yet" : "No events match your filter"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
