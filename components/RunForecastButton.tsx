"use client";

import { useState } from "react";
import { triggerForecastRun } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RunForecastButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRun() {
    setLoading(true);
    try {
      await triggerForecastRun();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={loading}
      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Running…" : "Run Forecast"}
    </button>
  );
}
