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
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Procurement & PO Handoff</h1>
        <p className="text-slate-500 text-sm mt-1">
          Approved reorder items ready for purchase order generation
        </p>
      </div>
      <ProcurementClient items={items} />
    </div>
  );
}
