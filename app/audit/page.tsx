import { getAuditEvents } from "@/lib/actions";
import { AuditClient } from "@/components/AuditClient";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await getAuditEvents(200);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity & Audit Log</h1>
        <p className="text-slate-500 text-sm mt-1">
          Immutable event record · Every upload, run, approval, override, and config change
        </p>
      </div>
      <AuditClient events={events as Parameters<typeof AuditClient>[0]["events"]} />
    </div>
  );
}
