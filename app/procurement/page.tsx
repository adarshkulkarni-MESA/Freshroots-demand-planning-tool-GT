import { getApprovedForProcurement } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const items = await getApprovedForProcurement() as Record<string, unknown>[];

  // Group by distributor
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const dist = String(item.distributor_name);
    if (!grouped[dist]) grouped[dist] = [];
    grouped[dist].push(item);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Procurement & PO Handoff</h1>
        <p className="text-slate-500 text-sm mt-1">
          Approved reorder items ready for purchase order generation
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No approved items for procurement yet.</p>
          <p className="text-slate-400 text-sm mt-1">Approve recommendations in the Human Review section first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dist, distItems]) => (
            <div key={dist} className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                <h2 className="font-semibold text-slate-800">{dist}</h2>
                <div className="text-xs text-slate-500 mt-0.5">{distItems.length} items</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-2 text-slate-500 font-medium">SKU</th>
                    <th className="text-left px-5 py-2 text-slate-500 font-medium">Name</th>
                    <th className="text-right px-5 py-2 text-slate-500 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {distItems.map((item) => (
                    <tr key={String(item.id)} className="border-b border-slate-50">
                      <td className="px-5 py-2 font-mono text-slate-700">{String(item.sku_id)}</td>
                      <td className="px-5 py-2 text-slate-800">{String(item.sku_name)}</td>
                      <td className="px-5 py-2 text-right font-semibold text-slate-900">{String(item.reorder_qty)} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
            <strong className="text-slate-800">Zoho Inventory Integration</strong> is available as a manual trigger once configured.
            PO dispatch requires explicit authorisation — orders are never sent automatically.
          </div>
        </div>
      )}
    </div>
  );
}
