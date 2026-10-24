"use client";

import { useState } from "react";
import { createZohoPurchaseOrder } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type ProcurementItem = {
  id: number;
  sku_id: string;
  sku_name: string;
  reorder_qty: number | null;
  standard_reorder_qty: number;
  override_note: string | null;
  distributor_name: string;
};

type ZohoState = { loading?: boolean; poNumber?: string; error?: string };

export function ProcurementClient({ items }: { items: ProcurementItem[] }) {
  const router = useRouter();
  const [zohoStatus, setZohoStatus] = useState<Record<number, ZohoState>>({});

  const grouped: Record<string, ProcurementItem[]> = {};
  for (const item of items) {
    if (!grouped[item.distributor_name]) grouped[item.distributor_name] = [];
    grouped[item.distributor_name].push(item);
  }

  async function sendToZoho(id: number) {
    setZohoStatus((p) => ({ ...p, [id]: { loading: true } }));
    const result = await createZohoPurchaseOrder(id);
    if (result.success) {
      setZohoStatus((p) => ({ ...p, [id]: { poNumber: result.po_number } }));
      router.refresh();
    } else {
      setZohoStatus((p) => ({ ...p, [id]: { error: result.error } }));
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No approved items for procurement yet.</p>
        <p className="text-slate-400 text-sm mt-1">Approve recommendations in the Human Review section first.</p>
      </div>
    );
  }

  return (
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
                <th className="text-right px-5 py-2 text-slate-500 font-medium">Zoho PO</th>
              </tr>
            </thead>
            <tbody>
              {distItems.map((item) => {
                const state = zohoStatus[item.id];
                const existingPO = item.override_note?.startsWith("Zoho PO created:")
                  ? item.override_note.replace("Zoho PO created:", "").trim()
                  : null;
                const shownPO = state?.poNumber ?? existingPO;
                const qty = item.reorder_qty ?? item.standard_reorder_qty;

                return (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-mono text-slate-700 text-xs">{item.sku_id}</td>
                    <td className="px-5 py-3 text-slate-800">{item.sku_name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{qty} units</td>
                    <td className="px-5 py-3 text-right">
                      {shownPO ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {shownPO}
                        </span>
                      ) : state?.error ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                          <button
                            onClick={() => sendToZoho(item.id)}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => sendToZoho(item.id)}
                          disabled={state?.loading}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {state?.loading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          {state?.loading ? "Creating…" : "Send to Zoho"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>PO dispatch is always a manual action.</strong>{" "}
        Clicking &ldquo;Send to Zoho&rdquo; creates a draft PO in Zoho Inventory with the listed quantity. Rate is set to ₹0 — update it in Zoho before confirming the order.
      </div>
    </div>
  );
}
