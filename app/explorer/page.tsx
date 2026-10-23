import { getLatestRecommendations } from "@/lib/actions";
import { SkuExplorer } from "@/components/SkuExplorer";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  const recs = await getLatestRecommendations();
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SKU Explorer</h1>
        <p className="text-slate-500 text-sm mt-1">Per-SKU drill-down with rule trace and sales trend</p>
      </div>
      <SkuExplorer recs={recs} />
    </div>
  );
}
