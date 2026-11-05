import { getApprovedForProcurement } from "@/lib/actions";
import { ProcurementClient } from "@/components/ProcurementClient";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const raw = await getApprovedForProcurement() as Record<string, unknown>[];
  const items = raw.map((r) => ({
    id: Number(r.id),
    sku_id: String(r.sku_id),
    sku_name: String(r.sku_name),
    reorder_qty: r.reorder_qty != null ? Number(r.reorder_qty) : null,
    standard_reorder_qty: Number(r.standard_reorder_qty ?? 0),
    override_note: r.override_note != null ? String(r.override_note) : null,
    distributor_name: String(r.distributor_name),
  }));

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="px-8 py-4 max-w-4xl">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Procurement & PO</h1>
          <p className="text-slate-400 mt-0.5 text-xs">Approved reorder items ready for purchase order generation</p>
        </div>
      </div>
      <div className="p-8 max-w-4xl">
        <ProcurementClient items={items} />
      </div>
    </div>
  );
}
