// Hardened mapper: KHÔNG bao giờ throw. Trả về DocumentItem đầy đủ field.
import type { DocumentItem as FullDoc } from "@/types/documentResponse";

const THIS_YEAR = new Date().getFullYear();

const num = (v: any, fb = 0) =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v.trim() !== "" && !Number.isNaN(+v)
      ? +v
      : fb;

const str = (v: any, fb = "") => (typeof v === "string" ? v : fb);

const coalesce = <T>(...vals: T[]) =>
  vals.find((x) => x !== undefined && x !== null);

function ensureId(raw: any): string {
  const id =
    coalesce(raw?.id, raw?.docId, raw?._id, raw?.uuid, raw?.pk, "") ?? "";
  const s = String(id);
  if (s.trim() !== "") return s;
  // fallback tạo id tạm (tránh key trùng gây side-effect)
  const seed = str(raw?.title) || str(raw?.name) || "doc";
  return `${seed}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toDocumentItem(raw: any): FullDoc {
  try {
    const id = ensureId(raw);
    const isPremium = !!coalesce(raw?.isPremium, raw?.premium, false);
    const pointsRaw = isPremium
      ? coalesce(raw?.points, raw?.price, raw?.credits)
      : null;

    return {
      id,
      title: str(coalesce(raw?.title, raw?.name), "Untitled"),
      orgName: str(
        coalesce(raw?.orgName, raw?.org_name, raw?.organization),
        "—",
      ),
      domain: str(
        coalesce(raw?.domain, raw?.subjectDomain, raw?.topic),
        "General",
      ),
      specialization: str(
        coalesce(raw?.specialization, raw?.spec, raw?.category),
        "General",
      ),
      uploader: str(
        coalesce(raw?.uploader, raw?.author, raw?.owner, raw?.createdBy),
        "unknown",
      ),
      publicYear: num(coalesce(raw?.publicYear, raw?.year), THIS_YEAR),
      isPremium,
      points: isPremium && typeof pointsRaw === "number" ? pointsRaw : null,
      description: str(
        coalesce(
          raw?.description,
          raw?.desc,
          raw?.overview,
          raw?.abstract,
          raw?.summary_text,
          "",
        ),
        "",
      ),
      summarizations: {
        short: str(
          coalesce(
            raw?.summarizations?.short,
            raw?.summaries?.short,
            raw?.summary?.short,
            raw?.shortSummary,
            raw?.summary_short,
            "",
          ),
          "",
        ),
        medium: str(
          coalesce(
            raw?.summarizations?.medium,
            raw?.summaries?.medium,
            raw?.summary?.medium,
            raw?.summary,
            raw?.summaryContent,
            raw?.summary_content,
            "",
          ),
          "",
        ),
        detailed: str(
          coalesce(
            raw?.summarizations?.detailed,
            raw?.summaries?.detailed,
            raw?.summary?.detailed,
            raw?.longSummary,
            raw?.summary_long,
            "",
          ),
          "",
        ),
      },
      upvote_counts: num(
        coalesce(raw?.upvote_counts, raw?.upvotes, raw?.likes),
        0,
      ),
      downvote_counts: num(
        coalesce(raw?.downvote_counts, raw?.downvotes, raw?.dislikes),
        0,
      ),
      thumbnail: str(
        coalesce(raw?.thumbnail, raw?.thumb, raw?.cover, raw?.image),
        "data:image/svg+xml,",
      ),
    };
  } catch {
    // fallback cực đoan nếu raw cực kỳ lỗi
    return {
      id: `doc-${Math.random().toString(36).slice(2, 8)}`,
      title: "Untitled",
      orgName: "—",
      domain: "General",
      specialization: "General",
      uploader: "unknown",
      publicYear: THIS_YEAR,
      isPremium: false,
      points: null,
      description: "",
      summarizations: { short: "", medium: "", detailed: "" },
      upvote_counts: 0,
      downvote_counts: 0,
      thumbnail: "data:image/svg+xml,",
    };
  }
}
