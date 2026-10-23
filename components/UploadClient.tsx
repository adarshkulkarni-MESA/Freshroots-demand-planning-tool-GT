"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { processCSVUpload } from "@/lib/actions";
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";

interface ImportLog {
  id: number; file_type: string; filename: string;
  row_count: number; status: string; imported_at: string;
}

const FILE_TYPES = [
  {
    key: "weekly_sales" as const,
    label: "Weekly Sales",
    desc: "Columns: sku_id, week_label, units_sold",
    icon: "📈",
    requiredCols: ["sku_id", "week_label", "units_sold"],
  },
  {
    key: "inventory_snapshot" as const,
    label: "Inventory Snapshot",
    desc: "Columns: sku_id, units_on_hand, as_of_date",
    icon: "📦",
    requiredCols: ["sku_id", "units_on_hand"],
  },
  {
    key: "skus" as const,
    label: "SKU Master",
    desc: "Columns: sku_id, sku_name, category, perishability",
    icon: "🏷️",
    requiredCols: ["sku_id", "sku_name"],
  },
  {
    key: "distributors" as const,
    label: "Distributor Master",
    desc: "Columns: distributor_id, name, region",
    icon: "🚚",
    requiredCols: ["distributor_id", "name"],
  },
];

type FileType = (typeof FILE_TYPES)[number]["key"];

interface PendingFile {
  id: string;
  file: File;
  detectedType: FileType | null;
  rows: Record<string, string>[];
  headers: string[];
  status: "pending" | "uploading" | "done" | "error";
  result?: { imported: number; skipped: number; error?: string };
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function detectType(filename: string, headers: string[]): FileType | null {
  const name = filename.toLowerCase();
  if (name.includes("sales") || name.includes("weekly")) return "weekly_sales";
  if (name.includes("inventory") || name.includes("stock") || name.includes("snapshot")) return "inventory_snapshot";
  if (name.includes("sku") || name.includes("product") || name.includes("master")) return "skus";
  if (name.includes("distributor") || name.includes("vendor") || name.includes("supplier")) return "distributors";
  // Infer from headers
  if (headers.includes("week_label") || headers.includes("units_sold")) return "weekly_sales";
  if (headers.includes("units_on_hand") || headers.includes("closing_stock")) return "inventory_snapshot";
  if (headers.includes("sku_name") || headers.includes("perishability")) return "skus";
  if (headers.includes("distributor_id") || headers.includes("region")) return "distributors";
  return null;
}

export function UploadClient({ history }: { history: ImportLog[] }) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.name.endsWith(".csv"));
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCSV(text);
        const detectedType = detectType(file.name, headers);
        setPending((p) => [
          ...p,
          { id: `${file.name}-${Date.now()}`, file, detectedType, rows, headers, status: "pending" },
        ]);
      };
      reader.readAsText(file);
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  }

  function removeFile(id: string) {
    setPending((p) => p.filter((f) => f.id !== id));
  }

  function setType(id: string, type: FileType) {
    setPending((p) => p.map((f) => (f.id === id ? { ...f, detectedType: type } : f)));
  }

  async function uploadFile(pf: PendingFile) {
    if (!pf.detectedType) return;
    setPending((p) => p.map((f) => (f.id === pf.id ? { ...f, status: "uploading" } : f)));
    const result = await processCSVUpload(pf.detectedType, pf.rows);
    setPending((p) =>
      p.map((f) => (f.id === pf.id ? { ...f, status: result.error ? "error" : "done", result } : f))
    );
  }

  async function uploadAll() {
    for (const pf of pending.filter((f) => f.status === "pending" && f.detectedType)) {
      await uploadFile(pf);
    }
  }

  const readyCount = pending.filter((f) => f.status === "pending" && f.detectedType).length;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Data Upload & Health</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload CSV source files · Auto-detected type · Validation + import
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-6 ${
          isDragging ? "border-teal-400 bg-teal-50" : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
        }`}
      >
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Drop CSV files here or click to browse</p>
        <p className="text-sm text-slate-500 mt-1">Accepts: weekly_sales, inventory_snapshot, SKU master, distributor master</p>
        <input ref={fileInputRef} type="file" accept=".csv" multiple className="hidden" onChange={onFileInput} />
      </div>

      {/* Accepted file types reference */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {FILE_TYPES.map((ft) => (
          <div key={ft.key} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span>{ft.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{ft.label}</span>
            </div>
            <div className="text-xs text-slate-500">{ft.desc}</div>
          </div>
        ))}
      </div>

      {/* Pending files */}
      {pending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Files to import ({pending.length})</h2>
            {readyCount > 0 && (
              <button
                onClick={uploadAll}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Import All ({readyCount})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {pending.map((pf) => (
              <div key={pf.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{pf.file.name}</span>
                      <button onClick={() => removeFile(pf.id)} className="text-slate-400 hover:text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{pf.rows.length} rows · {pf.headers.join(", ")}</div>

                    {/* Type selector */}
                    {pf.status === "pending" && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">Type:</span>
                        {FILE_TYPES.map((ft) => (
                          <button
                            key={ft.key}
                            onClick={() => setType(pf.id, ft.key)}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                              pf.detectedType === ft.key
                                ? "bg-teal-600 text-white border-teal-600"
                                : "text-slate-600 border-slate-200 hover:border-teal-400"
                            }`}
                          >
                            {ft.icon} {ft.label}
                          </button>
                        ))}
                        <button
                          onClick={() => uploadFile(pf)}
                          disabled={!pf.detectedType}
                          className="ml-auto text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white px-3 py-1 rounded transition-colors"
                        >
                          Import
                        </button>
                      </div>
                    )}

                    {/* Status */}
                    {pf.status === "uploading" && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-teal-600">
                        <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        Importing…
                      </div>
                    )}
                    {pf.status === "done" && pf.result && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Imported {pf.result.imported} rows{pf.result.skipped ? ` · ${pf.result.skipped} skipped` : ""}
                      </div>
                    )}
                    {pf.status === "error" && pf.result && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {pf.result.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import history */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3">Import History</h2>
        {history.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No imports yet — upload a file above.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">File Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Rows</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Imported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.file_type}</td>
                    <td className="px-4 py-3 text-slate-700">{log.row_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                        log.status === "success" ? "bg-green-100 text-green-700" :
                        log.status === "processing" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {log.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.imported_at?.slice(0, 16) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
