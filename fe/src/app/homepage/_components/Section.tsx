"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles.module.css";
import DocCard from "./DocCard";
import HorizontalScroll from "./HorizontalScroll";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import type { DocumentItem as BaseDoc } from "@/types/document-homepage";

export default function Section({
  title,
  items,
  sectionKey,
  defaultPageSize = 12,
}: {
  title: string;
  items: BaseDoc[];
  sectionKey: string;
  defaultPageSize?: number;
}) {
  const { q } = useHomepage();
  const { open } = useModalPreview();

  // Chuẩn hoá data cho DocCard (bổ sung viewCount nếu thiếu)
  // Sort by upvoteCount descending nếu là section "top" (Top Upvoted)
  const normalized: BaseDoc[] = useMemo(() => {
    const mapped = (items ?? []).map((d) => ({
      ...d,
      viewCount: (d as any).viewCount ?? 0,
    }));

    // Sort by upvoteCount descending cho Top Upvoted section
    if (sectionKey === "top") {
      mapped.sort((a, b) => (b.upvote_counts ?? 0) - (a.upvote_counts ?? 0));
    }

    return mapped;
  }, [items, sectionKey]);

  // Pagination thuần client-side (không sync URL)
  const [page, setPage] = useState(1);
  const [size] = useState(defaultPageSize);

  // Filter theo q
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return normalized;
    return normalized.filter((d) => {
      const pts = (d.points ?? "").toString();
      return (
        d.title.toLowerCase().includes(s) ||
        d.uploader.toLowerCase().includes(s) ||
        d.specialization.toLowerCase().includes(s) ||
        d.orgName.toLowerCase().includes(s) ||
        pts.includes(s)
      );
    });
  }, [q, normalized]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / Math.max(1, size)),
  );
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * Math.max(1, size);
  const pageItems = filtered.slice(start, start + Math.max(1, size));

  // Khi filter hoặc items đổi → quay về page 1
  useEffect(() => {
    if (clampedPage !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, items]);

  if (!normalized.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>{title}</div>
      </div>

      <HorizontalScroll>
        {pageItems.map((d) => (
          <DocCard key={d.id} {...d} onPreview={() => open(d)} />
        ))}
      </HorizontalScroll>
    </section>
  );
}
