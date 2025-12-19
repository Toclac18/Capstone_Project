import { mockLibraryDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Read all possible filter params from request
  const search = searchParams.get("search") || searchParams.get("searchKeyword") || undefined;
  const source = searchParams.get("source") as "UPLOADED" | "REDEEMED" | undefined;
  const isOwned = searchParams.get("isOwned");
  const isPurchased = searchParams.get("isPurchased");
  const docTypeId = searchParams.get("docTypeId") || undefined;
  const domainId = searchParams.get("domainId") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 0;
  const size = searchParams.get("size") || searchParams.get("limit");
  const limit = size ? parseInt(size) : 12;

  if (USE_MOCK) {
    const result = mockLibraryDB.getLibrary({
      search,
      source,
      type: undefined,
      domain: undefined,
      dateFrom,
      dateTo,
      page: page + 1,
      limit,
    });
    return jsonResponse(result, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }
  
  // Build query params matching backend API
  const queryParams = new URLSearchParams();

  // Search keyword
  if (search) {
    queryParams.append("searchKeyword", search);
  }

  // Source filter - handle both formats
  if (isOwned === "true") {
    queryParams.append("isOwned", "true");
  } else if (isPurchased === "true") {
    queryParams.append("isPurchased", "true");
  } else if (source === "UPLOADED") {
    queryParams.append("isOwned", "true");
  } else if (source === "REDEEMED") {
    queryParams.append("isPurchased", "true");
  }

  // Type and Domain filters (UUID)
  if (docTypeId) {
    queryParams.append("docTypeId", docTypeId);
  }
  if (domainId) {
    queryParams.append("domainId", domainId);
  }

  // Date range
  if (dateFrom) {
    queryParams.append("dateFrom", dateFrom);
  }
  if (dateTo) {
    queryParams.append("dateTo", dateTo);
  }

  // Pagination - backend uses 0-indexed page
  queryParams.append("page", String(page));
  queryParams.append("size", String(limit));

  const url = `${BE_BASE}/api/documents/library${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  // Backend returns: { success, message, data: DocumentLibraryResponse[], pageInfo, timestamp }
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const text = await upstream.text();
  try {
    const backendResponse = JSON.parse(text);

    // Backend format: { success, message, data: DocumentLibraryResponse[], pageInfo: { page, size, totalElements, ... }, timestamp }
    const documents = Array.isArray(backendResponse.data)
      ? backendResponse.data
      : [];
    const pageInfo = backendResponse.pageInfo || {};

    // Fetch tags to map tagNames to tagIds
    let tagsMap: Map<string, string> = new Map();
    try {
      const tagsHeaders = new Headers({ "Content-Type": "application/json" });
      if (authHeader) {
        tagsHeaders.set("Authorization", authHeader);
      }
      const tagsResponse = await fetch(`${BE_BASE}/api/tags/all`, {
        method: "GET",
        headers: tagsHeaders,
        cache: "no-store",
      });
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        const tags = Array.isArray(tagsData) ? tagsData : tagsData?.data || [];
        // Create map: tagName -> tagId
        tags.forEach((tag: any) => {
          if (tag.name && tag.id) {
            tagsMap.set(tag.name, tag.id);
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch tags for mapping:", error);
    }

    // Fetch domains and specializations to map specializationName to specializationId
    let specializationsMap: Map<string, string> = new Map();
    try {
      const domainsHeaders = new Headers({
        "Content-Type": "application/json",
      });
      const domainsResponse = await fetch(`${BE_BASE}/api/public/domains`, {
        method: "GET",
        headers: domainsHeaders,
        cache: "no-store",
      });
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        const domains = Array.isArray(domainsData)
          ? domainsData
          : domainsData?.data || [];

        // For each domain, fetch specializations
        for (const domain of domains) {
          if (domain.id) {
            try {
              const specsResponse = await fetch(
                `${BE_BASE}/api/public/domains/${domain.id}/specializations`,
                {
                  method: "GET",
                  headers: domainsHeaders,
                  cache: "no-store",
                },
              );
              if (specsResponse.ok) {
                const specsData = await specsResponse.json();
                const specs = Array.isArray(specsData)
                  ? specsData
                  : specsData?.data || [];
                // Create map: specializationName -> specializationId
                specs.forEach((spec: any) => {
                  if (spec.name && spec.id) {
                    specializationsMap.set(spec.name, spec.id);
                  }
                });
              }
            } catch (error) {
              console.error(
                `Failed to fetch specializations for domain ${domain.id}:`,
                error,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(
        "Failed to fetch domains/specializations for mapping:",
        error,
      );
    }

    // Filter to only show ACTIVE documents (approved and published)
    const activeDocuments = documents.filter(
      (doc: any) => doc.status === "ACTIVE",
    );

    // Transform to FE format - map backend fields to frontend format
    const transformed = {
      documents: activeDocuments.map((doc: any) => {
        // Map tagNames to tagIds
        let tagIds: string[] = [];
        if (
          doc.tagNames &&
          Array.isArray(doc.tagNames) &&
          doc.tagNames.length > 0
        ) {
          tagIds = doc.tagNames
            .map((tagName: string) => tagsMap.get(tagName))
            .filter(
              (tagId: string | undefined): tagId is string =>
                tagId !== undefined,
            );
        } else if (doc.tagIds && Array.isArray(doc.tagIds)) {
          tagIds = doc.tagIds;
        }

        // Map specializationName to specializationId
        let specializationId: string | undefined = doc.specializationId;
        if (!specializationId && doc.specializationName) {
          specializationId = specializationsMap.get(doc.specializationName);
        }

        return {
          id: doc.id,
          documentName: doc.title,
          description: doc.description,
          uploadDate: doc.createdAt || doc.uploadDate,
          type: doc.docTypeName || doc.type,
          domain: doc.domainName || doc.domain,
          specializationId: specializationId,
          specializationName: doc.specializationName,
          fileSize: doc.fileSize || 0,
          source: doc.userRelation?.isOwned ? "UPLOADED" : "REDEEMED",
          pages: doc.pageCount || doc.pages || 0,
          reads: doc.viewCount || doc.reads || 0,
          visibility: doc.visibility,
          interest: doc.interest,
          status:
            doc.status === "ACTIVE"
              ? "SUCCESS"
              : doc.status === "PENDING"
                ? "PENDING"
                : "FAILED",
          thumbnailUrl: doc.thumbnailUrl,
          tagIds: tagIds,
          organizationId: doc.organizationId,
        };
      }),
      // Filter DELETED documents - backend should ideally filter these, but we handle it client-side
      // Keep total from backend for pagination (backend may have already filtered)
      total: pageInfo.totalElements ?? activeDocuments.length,
      page: (pageInfo.page ?? 0) + 1, // Backend uses 0-indexed, FE uses 1-indexed
      limit: pageInfo.size ?? 12,
    };

    return jsonResponse(transformed, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch (error: any) {
    console.error("Error parsing library response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/library/route.ts/GET",
  });
