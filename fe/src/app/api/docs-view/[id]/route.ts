// src/app/api/docs/[id]/route.ts
type DocDetail = {
  id: string;
  title: string;
  orgName: string;
  uploader: string;
  specialization: string;
  isPremium: boolean;
  points?: number | null;
  viewCount: number;
  downloadCount: number;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  pageCount: number;
  thumbnail?: string;
  description?: string;
  fileUrl: string;
};

const mockDocs: DocDetail[] = [
  {
    id: "11",
    title: "Practical Civil Engineering",
    orgName: "University of Oxford",
    uploader: "viet.hung",
    specialization: "Civil Engineering",
    isPremium: false,
    points: null,
    viewCount: 12456,
    downloadCount: 342,
    upvote_counts: 820,
    downvote_counts: 73,
    vote_scores: 747,
    pageCount: 147,
    thumbnail: "/placeholder-thumbnail.png",
    description:
      "This document provides a rigorous exploration of civil engineering fundamentals, methods, and case studies.",
    fileUrl:
      "https://example.com/presigned/practical-civil-engineering.pdf?sig=mock",
  },
  {
    id: "12",
    title: "Advanced Structural Analysis",
    orgName: "MIT",
    uploader: "alice",
    specialization: "Civil Engineering",
    isPremium: true,
    points: 50,
    viewCount: 9876,
    downloadCount: 0,
    upvote_counts: 530,
    downvote_counts: 41,
    vote_scores: 489,
    pageCount: 226,
    thumbnail: "/placeholder-thumbnail.png",
    description: "Premium course notes on structural analysis.",
    fileUrl: "https://example.com/presigned/advanced-structural.pdf?sig=mock",
  },
];

function json(data: any, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) return json({ message: "Missing id" }, 400);

  const doc = mockDocs.find((d) => d.id === id);
  if (!doc) return json({ message: "Not found" }, 404);

  const related = mockDocs
    .filter((d) => d.specialization === doc.specialization && d.id !== doc.id)
    .sort((a, b) => b.vote_scores - a.vote_scores)
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      title: d.title,
      orgName: d.orgName,
      specialization: d.specialization,
      thumbnail: d.thumbnail || "/placeholder-thumbnail.png",
      upvote_counts: d.upvote_counts,
      downvote_counts: d.downvote_counts,
      vote_scores: d.vote_scores,
      isPremium: d.isPremium,
    }));

  return json({
    detail: doc,
    related,
    stats: {
      views: doc.viewCount,
      downloads: doc.downloadCount,
      upvotes: doc.upvote_counts,
      downvotes: doc.downvote_counts,
    },
  });
}
