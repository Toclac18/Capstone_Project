"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../HomepageProvider";

// Accept flexible input from provider (DocumentLite or similar)
type AnyDoc = Record<string, any>;

function readInt(sp: URLSearchParams, key: string, fallback: number) {
  const v = parseInt(sp.get(key) || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export default function Section({
  title,
  items,
  sectionKey,
  defaultPageSize = 8,
}: {
  title: string;
  items: AnyDoc[]; // NOTE: flexible to avoid incompatibilities
  sectionKey: string;
  defaultPageSize?: number;
}) {
  const { q } = useHomepage();
  const sp = useSearchParams();
  const router = useRouter();

  const pageKey = `${sectionKey}Page`;
  const sizeKey = `${sectionKey}Size`;

  const [size] = useState(() =>
    readInt(new URLSearchParams(sp.toString()), sizeKey, defaultPageSize),
  );
  const [page, setPage] = useState(() =>
    readInt(new URLSearchParams(sp.toString()), pageKey, 1),
  );

  // local filter: expand to orgName/subject/points
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((d) => {
      const t = d.title?.toLowerCase?.() ?? "";
      const u = d.uploader?.toLowerCase?.() ?? "";
      const spz = d.specialization?.toLowerCase?.() ?? "";
      const org = (d.orgName ?? d.org_name ?? "").toLowerCase?.() ?? "";
      const sub = d.subject?.toLowerCase?.() ?? "";
      const pts = d.points?.toString?.().toLowerCase?.() ?? "";
      return (
        t.includes(s) ||
        u.includes(s) ||
        spz.includes(s) ||
        org.includes(s) ||
        sub.includes(s) ||
        pts.includes(s)
      );
    });
  }, [q, items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * size;
  const pageItems = filtered.slice(start, start + size);

  const updateQuery = (kv: Record<string, string | number>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(kv).forEach(([k, v]) => {
      if (!v || v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    });
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setPage(1);
    updateQuery({ [pageKey]: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, items]);

  useEffect(() => {
    updateQuery({ [pageKey]: clampedPage, [sizeKey]: size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage, size]);

  if (!items?.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>{title}</div>
      </div>

      <div className={styles.cardsGrid}>
        {pageItems.map((d) => (
          <DocCard
            key={d.id}
            id={d.id}
            title={d.title}
            subject={d.subject}
            pageCount={d.pageCount}
            specialization={d.specialization}
            upvote_counts={d.upvote_counts ?? d.upvotes ?? 0}
            downvote_counts={d.downvote_counts ?? d.downvotes ?? 0}
            uploader={d.uploader}
            thumbnail={d.thumbnail}
            // map to DocCard exact props with safe fallbacks
            orgName={d.orgName ?? d.org_name ?? "—"}
            viewCount={
              typeof d.viewCount === "number"
                ? d.viewCount
                : typeof d.views === "number"
                  ? d.views
                  : 0
            }
            isPremium={!!d.isPremium}
            points={d.points}
          />
        ))}
      </div>
    </section>
  );
}
