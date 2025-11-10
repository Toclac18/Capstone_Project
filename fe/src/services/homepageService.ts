// src/services/homepageService.ts
import { apiClient } from "./http";

export type DocumentLite = {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  points?: number;
  viewCount: number;
  isPremium: boolean;
  specialization: string;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  uploader: string;
  thumbnail: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type HomepageQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  specialization?: string;
  group?: "continueReading" | "topUpvoted" | "bySpecialization" | "all";
};

export async function fetchHomepage(params: HomepageQuery = {}) {
  const res = await apiClient.get("/homepage", { params });
  return res.data as Paginated<DocumentLite>;
}

export async function fetchTopUpvoted(page = 1, pageSize = 12) {
  const res = await apiClient.get("/homepage", {
    params: { group: "topUpvoted", page, pageSize },
  });
  return res.data as Paginated<DocumentLite>;
}

export async function fetchContinueReading(page = 1, pageSize = 8) {
  const res = await apiClient.get("/homepage", {
    params: { group: "continueReading", page, pageSize },
  });
  return res.data as Paginated<DocumentLite>;
}

export async function fetchBySpecialization(
  specialization: string,
  page = 1,
  pageSize = 12,
) {
  const res = await apiClient.get("/homepage", {
    params: { group: "bySpecialization", specialization, page, pageSize },
  });
  return res.data as Paginated<DocumentLite>;
}
