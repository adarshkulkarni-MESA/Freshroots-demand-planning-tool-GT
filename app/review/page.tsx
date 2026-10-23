import { getLatestRecommendations } from "@/lib/actions";
import { ReviewQueue } from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const recs = await getLatestRecommendations();
  const actionable = recs.filter((r) => r.action !== "MONITOR");
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Human Review & Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">
          Raghav's approval queue · {actionable.filter((r) => r.approval_status === "pending").length} items pending
        </p>
      </div>
      <ReviewQueue recs={actionable} />
    </div>
  );
}
