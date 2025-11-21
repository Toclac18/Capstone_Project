"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../styles.module.css";
import DocCard, { type DocCardItem } from "./DocCard";
import { useHomepage } from "../HomepageProvider";
import { useModalPreview } from "@/components/ModalPreview";
import type { DocumentItem as BaseDoc } from "@/types/documentResponse";

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
  items: BaseDoc[];
  sectionKey: string;
  defaultPageSize?: number;
}) {
  const { q } = useHomepage();
  const spObj = useSearchParams();
  const router = useRouter();
  const { open } = useModalPreview();

  const normalized: DocCardItem[] = useMemo(
    () =>
      (items ?? []).map((d) => ({
        ...d,
        viewCount: (d as any).viewCount ?? 0,
      })),
    [items],
  );

  const initial = useMemo(() => {
    const sp = new URLSearchParams(spObj.toString());
    return {
      page: readInt(sp, `${sectionKey}Page`, 1),
      size: readInt(sp, `${sectionKey}Size`, defaultPageSize),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [page, setPage] = useState(initial.page);
  const [size] = useState(initial.size);

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

  // Khi filter đổi, về page 1 nếu đang ở trang khác
  useEffect(() => {
    if (clampedPage !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, items]);

  useEffect(() => {
    const current = new URLSearchParams(spObj.toString());
    const next = new URLSearchParams(current.toString());
    const pk = `${sectionKey}Page`;
    const sk = `${sectionKey}Size`;

    let changed = false;
    if (current.get(pk) !== String(clampedPage)) {
      next.set(pk, String(clampedPage));
      changed = true;
    }
    if (current.get(sk) !== String(size)) {
      next.set(sk, String(size));
      changed = true;
    }

    if (changed) {
      const qs = next.toString();
      const url = qs ? `?${qs}` : location.pathname;
      router.replace(url, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage, size, sectionKey, spObj]);

  if (!normalized.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>{title}</div>
      </div>

      <div className={styles.cardsGrid}>
        {pageItems.map((d) => (
          <DocCard key={d.id} {...d} onPreview={() => open(d)} />
        ))}
      </div>
    </section>
  );
}
