"use client";

import { useState } from "react";
import { approveRecommendation, rejectRecommendation, createZohoPurchaseOrder } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { AlertTriangle, PauseCircle, CheckCircle2, XCircle, AlertCircle, ShoppingCart } from "lucide-react";

type Rec = {
  id: number; sku_id: string; sku_name: string; action: string;
  reorder_qty: number | null; stock_cover_weeks: number;
  avg_4w: number; avg_12w: number; perishability: string;
  approval_status: string; override_note?: string | null;
  flags: { rule: string; detail: string }[];
  distributor_name: string;
};

export function ReviewQueue({ recs }: { recs: Rec[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, string>>({});
  const [zohoStatus, setZohoStatus] = useState<Record<number, { loading?: boolean; result?: { success: boolean; po_number?: string; error?: string } }>>({});

  async function approve(id: number) {
    setLoading((p) => ({ ...p, [id]: "approving" }));
    await approveRecommendation(id, "Raghav Kulkarni", notes[id]);
    router.refresh();
    setLoading((p) => ({ ...p, [id]: "" }));
  }

  async function sendToZoho(id: number) {
    setZohoStatus((p) => ({ ...p, [id]: { loading: true } }));
    const result = await createZohoPurchaseOrder(id);
    setZohoStatus((p) => ({ ...p, [id]: { result } }));
  }

  async function reject(id: number) {
    const note = notes[id];
    if (!note?.trim()) {
      alert("Please add a justification note before rejecting.");
      return;
    }
    setLoading((p) => ({ ...p, [id]: "rejecting" }));
    await rejectRecommendation(id, "Raghav Kulkarni", note);
    router.refresh();
    setLoading((p) => ({ ...p, [id]: "" }));
  }

  if (recs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No items to review</p>
        <p className="text-slate-400 text-sm mt-1">All actionable recommendations have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recs.map((rec) => {
        const isBorderline = rec.flags.some((f) => f.detail.includes("BORDERLINE"));
        const isApproved = rec.approval_status === "approved";
        const isRejected = rec.approval_status === "rejected";
        const isPending = rec.approval_status === "pending";
        const existingPO = rec.override_note?.startsWith("Zoho PO created:")
          ? rec.override_note.replace("Zoho PO created:", "").trim() : null;
        const zs = zohoStatus[rec.id];
        const shownPO = zs?.result?.po_number ?? existingPO;

        return (
          <div
            key={rec.id}
            className={`bg-white rounded-xl border p-5 ${
              isApproved ? "border-green-200" : isRejected ? "border-slate-200 opacity-70" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {rec.action === "REORDER_URGENT" ? (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                      <AlertTriangle className="w-3 h-3" /> Reorder Urgent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">
                      <PauseCircle className="w-3 h-3" /> Pause Order
                    </span>
                  )}
                  {rec.perishability === "High" && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">Perishable</span>
                  )}
                  {isBorderline && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-semibold px-2 py-1 rounded border border-amber-200">
                      <AlertCircle className="w-3 h-3" /> Borderline — review carefully
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <div className="font-semibold text-slate-900">{rec.sku_id} — {rec.sku_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Via {rec.distributor_name}</div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Stock Cover</div>
                    <div className={`font-semibold ${rec.stock_cover_weeks < 4 ? "text-red-600" : rec.stock_cover_weeks < 6 ? "text-orange-600" : "text-amber-600"}`}>
                      {rec.stock_cover_weeks.toFixed(2)} weeks
                    </div>
                  </div>
                  {rec.reorder_qty && (
                    <div>
                      <div className="text-xs text-slate-500">Suggested Qty</div>
                      <div className="font-semibold text-slate-900">{rec.reorder_qty} units</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-slate-500">4w / 12w Avg</div>
                    <div className="font-semibold text-slate-700">{rec.avg_4w.toFixed(0)} / {rec.avg_12w.toFixed(0)}</div>
                  </div>
                </div>

                {/* Rule flags */}
                <div className="mt-3 space-y-1">
                  {rec.flags.map((f, i) => (
                    <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                      <span className="font-semibold text-slate-700">{f.rule}:</span> {f.detail}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status badge for decided items */}
              {!isPending && (
                <div className="flex flex-col items-end gap-2">
                  <div className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                    isApproved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {isApproved ? "✓ Approved" : "✗ Rejected"}
                  </div>
                  {/* Zoho PO button — only for approved REORDER_URGENT */}
                  {isApproved && rec.action === "REORDER_URGENT" && (
                    <div>
                      {shownPO ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          PO {shownPO} created
                        </div>
                      ) : zs?.loading ? (
                        <div className="flex items-center gap-1.5 text-xs text-orange-600">
                          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          Creating PO…
                        </div>
                      ) : zs?.result?.success === false ? (
                        <div className="space-y-1">
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 max-w-48">
                            {zs.result.error}
                          </div>
                          <button onClick={() => sendToZoho(rec.id)} className="text-xs text-orange-600 underline">Retry</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => sendToZoho(rec.id)}
                          className="flex items-center gap-1.5 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Send PO to Zoho
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Approval controls */}
            {isPending && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <textarea
                  placeholder="Override note (required for rejection, optional for approval)…"
                  value={notes[rec.id] ?? ""}
                  onChange={(e) => setNotes((p) => ({ ...p, [rec.id]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
                  rows={2}
                />
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => approve(rec.id)}
                    disabled={!!loading[rec.id]}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {loading[rec.id] === "approving" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={() => reject(rec.id)}
                    disabled={!!loading[rec.id]}
                    className="flex items-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-60 text-red-600 text-sm font-medium px-4 py-2 rounded-lg border border-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    {loading[rec.id] === "rejecting" ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
