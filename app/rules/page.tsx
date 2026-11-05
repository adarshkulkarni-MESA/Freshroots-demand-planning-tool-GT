import { RULES_VERSION } from "@/lib/engine/rules";
import { getRulesConfig } from "@/lib/actions";
import { RulesClient } from "@/components/RulesClient";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const savedConfig = await getRulesConfig();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Rules & Configuration</h1>
        <p className="text-slate-500 text-sm mt-1">Raghav&apos;s 5 demand rules — editable thresholds with full audit trail</p>
      </div>
      <RulesClient savedConfig={savedConfig} rulesVersion={RULES_VERSION} />
    </div>
  );
}
