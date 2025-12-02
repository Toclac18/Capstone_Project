// src/types/document.ts
export type SaveListDocument = {
  id: string;
  title: string;

  organizationName: string;
  domainName: string;
  specializationName: string;

  uploader: string;
  publicYear: number;
  isPremium: boolean;
  points: number | null;

  description: string;

  shortSummary: string;
  mediumSummary: string;
  detailedSummary: string;

  upvoteCount: number;
  downvoteCount: number;

  thumbnailUrl: string;

  documentUrl: string;
  fileType: string;

  createdAt: string;
  updatedAt: string;
};
