// Review Request Types
export interface ReviewRequestResponse {
  id: string;
  document: {
    id: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    pageCount?: number | null;
    price?: number | null;
  };
  reviewer: {
    userId: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  assignedBy: {
    userId: string;
    email: string;
    fullName: string;
  };
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  responseDeadline?: string | null;
  reviewDeadline?: string | null;
  respondedAt?: string | null;
  rejectionReason?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AssignReviewerRequest {
  reviewerId: string;
  note?: string | null;
  existingReviewRequestId?: string | null; // For changing reviewer (cancel old PENDING request)
}

export interface ReviewerForAssign {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  avatarUrl?: string | null;
  status: string;
  domain?: {
    id: string;
    name: string;
  } | null;
  specialization?: {
    id: string;
    name: string;
    domain?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface ReviewRequestListResponse {
  content: ReviewRequestResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

