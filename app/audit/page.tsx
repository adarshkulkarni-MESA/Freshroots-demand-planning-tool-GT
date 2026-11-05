import { getAuditEvents } from "@/lib/actions";
import { AuditClient } from "@/components/AuditClient";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await getAuditEvents(200);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="px-8 py-4 max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Activity & Audit Log</h1>
          <p className="text-slate-400 mt-0.5 text-xs">
            Immutable event record · Every upload, run, approval, override, and config change
          </p>
        </div>
      </div>
      <div className="p-8 max-w-5xl">
        <AuditClient events={events as Parameters<typeof AuditClient>[0]["events"]} />
      </div>
    </div>
  );
}
