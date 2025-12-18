import { apiClient } from "./http";

/* ====================== TYPES ====================== */

export type ImportSource = string;

export type MemberImportBatch = {
  id: string;
  importSource: ImportSource;
  totalEmails: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  fileName: string | null;
  fileUrl: string | null;
  notes: string | null;
  adminName: string;
  adminEmail: string;
  importedAt: string;
};

export type OrgEnrollStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export type OrgEnrollment = {
  enrollmentId: string;
  memberId: string | null;
  memberEmail: string;
  memberFullName: string | null;
  memberAvatarUrl: string | null;
  organizationId: string;
  organizationName: string;
  status: OrgEnrollStatus;
  invitedAt: string | null;
  respondedAt: string | null;
};

export type ImportResultItem = {
  id: string;
  email: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  reason: string | null;
  createdAt: string;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ImportListFilters = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type FailedInvitation = {
  email: string;
  reason: string;
};

export type ImportResult = {
  importBatchId: string;
  totalEmails: number;
  successCount: number;
  successEmails: string[];
  failedCount: number;
  failedInvitations: FailedInvitation[];
  skippedCount: number;
  skippedEmails: string[];
};

type CreateImportApiResponse = {
  success: boolean;
  data: ImportResult;
  timestamp: string;
};

/* ====================== HELPERS ====================== */

function normalizePagedResult<T>(
  raw: any,
  fallbackPage: number,
  fallbackPageSize: number,
): PagedResult<T> {
  // 1) FE / mock PagedResult: { items, total, page, pageSize }
  if (Array.isArray(raw?.items)) {
    return {
      items: raw.items as T[],
      total:
        typeof raw.total === "number" ? raw.total : (raw.items as T[]).length,
      page: typeof raw.page === "number" ? raw.page : fallbackPage,
      pageSize:
        typeof raw.pageSize === "number" ? raw.pageSize : fallbackPageSize,
    };
  }

  // 2) Spring PageImpl: { content, totalElements, number, size }
  if (Array.isArray(raw?.content)) {
    return {
      items: raw.content as T[],
      total:
        typeof raw.totalElements === "number"
          ? raw.totalElements
          : (raw.content as T[]).length,
      page: typeof raw.number === "number" ? raw.number + 1 : fallbackPage, // 0-based -> 1-based
      pageSize: typeof raw.size === "number" ? raw.size : fallbackPageSize,
    };
  }

  // 3) REAL BE (và mock mới): { success, data: T[], pageInfo: {...} }
  if (Array.isArray(raw?.data)) {
    const pageInfo = raw.pageInfo ?? {};
    return {
      items: raw.data as T[],
      total:
        typeof pageInfo.totalElements === "number"
          ? pageInfo.totalElements
          : (raw.data as T[]).length,
      page:
        typeof pageInfo.page === "number"
          ? pageInfo.page + 1 // 0-based -> 1-based
          : fallbackPage,
      pageSize:
        typeof pageInfo.size === "number" ? pageInfo.size : fallbackPageSize,
    };
  }

  // 4) Thuần array
  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      total: (raw as T[]).length,
      page: fallbackPage,
      pageSize: fallbackPageSize,
    };
  }

  // 5) Fallback an toàn
  return {
    items: [],
    total: 0,
    page: fallbackPage,
    pageSize: fallbackPageSize,
  };
}
/* ====================== SERVICE ====================== */

/**
 * LIST BATCHES
 */
export async function fetchImports(
  filters: ImportListFilters,
): Promise<PagedResult<MemberImportBatch>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  const res = await apiClient.get("org-admin/imports", {
    params: {
      q: filters.q ?? "",
      status: filters.status ?? "ALL",
      page,
      pageSize,
    },
  });

  return normalizePagedResult<MemberImportBatch>(res.data, page, pageSize);
}

export async function fetchImportDetail(
  batchId: string,
  page = 1,
  pageSize = 10,
): Promise<PagedResult<OrgEnrollment>> {
  const res = await apiClient.get("org-admin/imports", {
    params: { id: batchId, page, pageSize },
  });
  return normalizePagedResult<OrgEnrollment>(res.data, page, pageSize);
}

/**
 * UPLOAD IMPORT (Excel)
 */
export async function createImport(form: FormData): Promise<ImportResult> {
  const res = await apiClient.post<CreateImportApiResponse>(
    "org-admin/imports",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  const data = res.data?.data;

  if (!data?.importBatchId) {
    throw new Error("Cannot detect importBatchId from server response");
  }

  return {
    importBatchId: data.importBatchId,
    totalEmails: data.totalEmails ?? 0,
    successCount: data.successCount ?? 0,
    successEmails: data.successEmails ?? [],
    failedCount: data.failedCount ?? 0,
    failedInvitations: data.failedInvitations ?? [],
    skippedCount: data.skippedCount ?? 0,
    skippedEmails: data.skippedEmails ?? [],
  };
}


/**
 * FETCH IMPORT RESULT ITEMS (SUCCESS, FAILED, SKIPPED)
 */
export async function fetchImportResultItems(
  batchId: string,
  page = 1,
  pageSize = 100,
): Promise<PagedResult<ImportResultItem>> {
  const res = await apiClient.get("org-admin/imports", {
    params: { id: batchId, page, pageSize },
  });
  return normalizePagedResult<ImportResultItem>(res.data, page, pageSize);
}
