import { getLatestRecommendations } from "@/lib/actions";
import { RecommendationsTable } from "@/components/RecommendationsTable";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const recs = await getLatestRecommendations();
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Demand Recommendations</h1>
        <p className="text-slate-500 text-sm mt-1">
          All 15 SKUs · Rules v1.0.0 · October 2026 (Festival month active)
        </p>
      </div>
      <RecommendationsTable recs={recs} />
    </div>
  );
}
