import { getLatestRecommendations } from "@/lib/actions";
import { RecommendationsTable } from "@/components/RecommendationsTable";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const recs = await getLatestRecommendations();
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="px-8 py-4">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Demand Recommendations</h1>
          <p className="text-slate-400 mt-0.5 text-xs">All SKUs · Rules v1.0.0 · October 2026</p>
        </div>
      </div>
      <div className="p-8">
        <RecommendationsTable recs={recs} />
      </div>
    </div>
  );
}
