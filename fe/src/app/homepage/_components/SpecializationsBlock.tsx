"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../HomepageProvider";

type Doc = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  specialization: string;
  upvote_counts: number;
  downvote_counts: number;
  uploader: string;
  thumbnail: string;
};
type Group = { name: string; items: Doc[] };

function readInt(sp: URLSearchParams, key: string, fallback: number) {
  const v = parseInt(sp.get(key) || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export default function SpecializationsBlock({
  groups,
  defaultGroupsPerPage = 2,
  maxItemsPerGroup = 8,
  /** khi true: chỉ render list, KHÔNG có pager nội bộ */
  disablePager = false,
}: {
  groups: Group[];
  defaultGroupsPerPage?: number;
  maxItemsPerGroup?: number;
  disablePager?: boolean;
}) {
  const { q } = useHomepage();

  // 🚫 KHÔNG đặt hook trong if/else. Gọi tất cả hook ở top-level.
  const sp = useSearchParams();
  const router = useRouter();

  // ép size tối thiểu 1 để tránh chia cho 0
  const safeDefault = Math.max(1, defaultGroupsPerPage || 1);

  // Nếu disablePager, vẫn khởi tạo state nhưng sẽ không dùng (an toàn về thứ tự hook)
  const initSize = disablePager
    ? safeDefault
    : readInt(new URLSearchParams(sp.toString()), "specSize", safeDefault);
  const initPage = disablePager
    ? 1
    : readInt(new URLSearchParams(sp.toString()), "specPage", 1);

  const [size, setSize] = useState(initSize);
  const [page, setPage] = useState(initPage);

  // Filter theo q cho cả 2 chế độ
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((d) => {
          const t = d.title?.toLowerCase() ?? "";
          const u = d.uploader?.toLowerCase() ?? "";
          const spz = d.specialization?.toLowerCase() ?? "";
          return t.includes(s) || u.includes(s) || spz.includes(s);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, groups]);

  // ======= RENDER KHÔNG PAGER (dùng cho phân trang toàn trang) =======
  if (disablePager) {
    if (!filtered.length) return null;
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>Specializations</div>
        </div>
        {filtered.map((g) => (
          <div key={g.name} className={styles.specBlock}>
            <div className={styles.specTitle}>Specialization: {g.name}</div>
            <div className={styles.cardsGrid}>
              {(maxItemsPerGroup > 0
                ? g.items.slice(0, maxItemsPerGroup)
                : g.items
              ).map((d) => (
                <DocCard key={d.id} {...d} />
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  // ======= RENDER CÓ PAGER NỘI BỘ (khi dùng độc lập) =======
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / Math.max(1, size)),
  );
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * Math.max(1, size);
  const visibleGroups = filtered.slice(start, start + Math.max(1, size));

  const updateQuery = (kv: Record<string, string | number>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(kv).forEach(([k, v]) => {
      if (!v || v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    });
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  // khi q/groups đổi → về trang 1
  useEffect(() => {
    setPage(1);
    updateQuery({ specPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, groups]);

  // đồng bộ page/size -> URL
  useEffect(() => {
    updateQuery({ specPage: clampedPage, specSize: Math.max(1, size) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage, size]);

  if (!filtered.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Specializations</div>

        <div className={styles.pager}>
          <label className={styles.pageSizeWrap}>
            <span className={styles.pageSizeLabel}>Groups / page</span>
            <select
              className={styles.pageSizeSelect}
              value={size}
              onChange={(e) => {
                const next = Math.max(
                  1,
                  parseInt(e.target.value, 10) || safeDefault,
                );
                setSize(next);
                setPage(1);
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button
            className={styles.pagerBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
            aria-label="Previous page"
            type="button"
          >
            ‹
          </button>
          <span className={styles.pagerText}>
            {clampedPage} / {totalPages}
          </span>
          <button
            className={styles.pagerBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={clampedPage >= totalPages}
            aria-label="Next page"
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      {visibleGroups.map((g) => (
        <div key={g.name} className={styles.specBlock}>
          <div className={styles.specTitle}>Specialization: {g.name}</div>
          <div className={styles.cardsGrid}>
            {(maxItemsPerGroup > 0
              ? g.items.slice(0, maxItemsPerGroup)
              : g.items
            ).map((d) => (
              <DocCard key={d.id} {...d} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
