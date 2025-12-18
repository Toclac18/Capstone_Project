import { DocumentItem } from "@/types/document-homepage";

const num = (v: any, fb = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fb;

const str = (v: any, fb = "") => (typeof v === "string" ? v : fb);

const coalesce = <T>(...vals: T[]) =>
  vals.find((x) => x !== undefined && x !== null);

export function toDocumentItem(raw: any): DocumentItem {
  if (!raw) {
    return {
      id: "",
      title: "Untitled",
      orgName: "",
      domain: "",
      specialization: "",
      uploader: "",
      publicYear: new Date().getFullYear(),
      isPremium: false,
      points: null,
      description: "",
      summarizations: { short: "", medium: "", detailed: "" },
      viewCount: 0,
      upvote_counts: 0,
      downvote_counts: 0,
      voteScore: 0,
      tags: [],
      thumbnail: "",
    };
  }

  const createdAt = raw?.createdAt ? new Date(raw.createdAt) : null;
  const year =
    createdAt && !Number.isNaN(createdAt.getFullYear())
      ? createdAt.getFullYear()
      : new Date().getFullYear();

  return {
    id: String(raw?.id ?? ""),
    title: str(raw?.title, "Untitled"),

    orgName: str(coalesce(raw?.organization?.name, raw?.orgName), "—"),

    specialization: str(
      coalesce(
        raw?.specialization?.name,
        raw?.specializationName, // từ read-history
        raw?.specialization,
      ),
      "General",
    ),

    domain: str(
      coalesce(
        raw?.specialization?.domain?.name,
        raw?.domainName, // từ read-history
        raw?.domain,
      ),
      "General",
    ),

    uploader: str(
      coalesce(raw?.uploader?.fullName, raw?.uploader?._name),
      "unknown",
    ),

    publicYear: year,

    isPremium: !!raw?.isPremium,
    hasRedeemed: raw?.userInfo?.hasRedeemed ?? false,
    points: typeof raw?.price === "number" ? raw.price : null,

    description: str(raw?.description, ""),

    summarizations: {
      short: str(
        coalesce(raw?.summarizations?.shortSummary, raw?.summarizations?.short),
        "",
      ),
      medium: str(
        coalesce(
          raw?.summarizations?.mediumSummary,
          raw?.summarizations?.medium,
        ),
        "",
      ),
      detailed: str(
        coalesce(
          raw?.summarizations?.detailedSummary,
          raw?.summarizations?.detailed,
        ),
        "",
      ),
    },

    viewCount: num(raw?.viewCount, 0),
    upvote_counts: num(raw?.upvoteCount, 0),
    downvote_counts: num(raw?.downvoteCount, 0),
    voteScore: num(raw?.voteScore, 0),

    tags: Array.isArray(raw?.tags)
      ? raw.tags.map((t: any) => ({
          id: String(t.id ?? ""),
          code: Number(t.code ?? 0),
          name: String(t.name ?? ""),
        }))
      : [],

    thumbnail: str(
      coalesce(raw?.thumbnailUrl, raw?.thumbnail),
      "data:image/svg+xml,",
    ),

    organization: raw?.organization
      ? {
          id: String(raw.organization.id ?? ""),
          name: String(raw.organization.name ?? ""),
          logoUrl: String(raw.organization.logoUrl ?? ""),
        }
      : undefined,
  };
}
