import { apiClient } from "./http";

export type ImportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type ImportListItem = {
  id: string;
  fileName: string;
  createdAt: string;
  createdBy: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  status: ImportStatus;
};
export type ImportListResponse = {
  items: ImportListItem[];
  total: number;
  page: number;
  pageSize: number;
};
export type RowResult = {
  row: number;
  fullName: string;
  username: string;
  email: string;
  imported: boolean;
  emailSent: boolean;
  error?: string | null;
};
export type ImportDetail = ImportListItem & { results: RowResult[] };

export async function fetchImports(params: { page?: number; pageSize?: number; q?: string; status?: string } = {}) {
  const res = await apiClient.get("org-admin/imports", { params });
  return res.data;
}

export async function fetchImportDetail(id: string) {
  const res = await apiClient.get("org-admin/imports", { params: { id } });
  return res.data;
}

export async function createImport(form: FormData) {
  const res = await apiClient.post("org-admin/imports", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function downloadImportResult(id: string) {
  const res = await apiClient.get("org-admin/imports", {
    params: { id, download: "csv" },
    responseType: "blob",
  });
  return res.data as Blob;
}