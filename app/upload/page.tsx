import { getImportHistory } from "@/lib/actions";
import { UploadClient } from "@/components/UploadClient";

interface ImportLog {
  id: number; file_type: string; filename: string;
  row_count: number; status: string; imported_at: string;
}

export default async function UploadPage() {
  const history = await getImportHistory();
  return <UploadClient history={history as ImportLog[]} />;
}
