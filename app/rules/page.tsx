import { RULES_VERSION } from "@/lib/engine/rules";
import { getRulesConfig } from "@/lib/actions";
import { RulesClient } from "@/components/RulesClient";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const savedConfig = await getRulesConfig();

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="px-8 py-4 max-w-3xl">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Rules & Configuration</h1>
          <p className="text-slate-400 mt-0.5 text-xs">Raghav&apos;s 5 demand rules — editable thresholds with full audit trail</p>
        </div>
      </div>
      <div className="p-8 max-w-3xl">
        <RulesClient savedConfig={savedConfig} rulesVersion={RULES_VERSION} />
      </div>
    </div>
  );
}
