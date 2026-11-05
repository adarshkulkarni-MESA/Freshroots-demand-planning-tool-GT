import { getLatestRecommendations } from "@/lib/actions";
import { ReviewQueue } from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const recs = await getLatestRecommendations();
  const actionable = recs.filter((r) => r.action !== "MONITOR");
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="px-8 py-4 max-w-4xl">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Human Review & Approvals</h1>
          <p className="text-slate-400 mt-0.5 text-xs">
            Raghav's queue · {actionable.filter((r) => r.approval_status === "pending").length} items pending
          </p>
        </div>
      </div>
      <div className="p-8 max-w-4xl">
        <ReviewQueue recs={actionable} />
      </div>
    </div>
  );
}
