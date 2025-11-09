"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../HomepageProvider";

type Item = {
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
  items: Item[];
  sectionKey: string; // ví dụ "cr", "tu", "spec-Software"
  defaultPageSize?: number; // 4/8/12...
}) {
  const { q } = useHomepage();
  const sp = useSearchParams();
  const router = useRouter();

  // keys theo URL
  const pageKey = `${sectionKey}Page`;
  const sizeKey = `${sectionKey}Size`;

  // init từ URL
  const [size, setSize] = useState(() =>
    readInt(new URLSearchParams(sp.toString()), sizeKey, defaultPageSize),
  );
  const [page, setPage] = useState(() =>
    readInt(new URLSearchParams(sp.toString()), pageKey, 1),
  );

  // filter cục bộ
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((d) => {
      const t = d.title?.toLowerCase() ?? "";
      const u = d.uploader?.toLowerCase() ?? "";
      const spz = d.specialization?.toLowerCase() ?? "";
      return t.includes(s) || u.includes(s) || spz.includes(s);
    });
  }, [q, items]);

  // phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * size;
  const pageItems = filtered.slice(start, start + size);

  // helper cập nhật URL nhe nhàng (replace, không spam history)
  const updateQuery = (kv: Record<string, string | number>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(kv).forEach(([k, v]) => {
      if (!v || v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    });
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  // khi q hoặc items đổi → reset về page 1
  useEffect(() => {
    setPage(1);
    updateQuery({ [pageKey]: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, items]);

  // khi đổi page/size → update URL
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
          <DocCard key={d.id} {...d} />
        ))}
      </div>
    </section>
  );
}
