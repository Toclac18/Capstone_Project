export interface ReviewResultResponse {
  id: string;
  reviewRequestId: string;
  document: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    fileUrl?: string;
    docType?: {
      id: string;
      code: number;
      name: string;
    };
    domain?: {
      id: string;
      code: number;
      name: string;
    };
    specialization?: {
      id: string;
      code: number;
      name: string;
    };
    tags?: Array<{
      id: string;
      code: number;
      name: string;
    }>;
  };
  reviewer: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
  report?: string;
  reportFileUrl?: string;
  decision: "APPROVED" | "REJECTED";
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  approval?: {
    approvedById: string;
    approvedByName: string;
    approvedAt: string;
    rejectionReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function getDocumentReviewResult(
  documentId: string
): Promise<ReviewResultResponse | null> {
  const response = await fetch(`/api/reader/documents/${documentId}/review-result`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch review result");
  }
  
  const result = await response.json();
  return result.data;
}
