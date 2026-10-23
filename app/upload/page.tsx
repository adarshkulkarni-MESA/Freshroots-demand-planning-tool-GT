export default function UploadPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Data Upload & Health</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload source CSV files · Validate schema · Review import history
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="text-4xl mb-3">✓</div>
        <p className="font-semibold text-slate-700">Seed data loaded</p>
        <p className="text-sm text-slate-500 mt-2">
          All 5 source files (SKU master, distributor master, weekly sales, inventory snapshot, festival calendar)
          have been pre-loaded from the provided CSVs.
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Full CSV upload UI with drag-and-drop, column mapping, and validation is scoped for the next iteration.
        </p>
      </div>
    </div>
  );
}
