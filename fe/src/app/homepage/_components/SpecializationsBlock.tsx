"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "../styles.module.css";
import EmptyState from "./EmptyState";
import DocCard from "./DocCard";
import HorizontalScroll from "./HorizontalScroll";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import type { DocumentItem as BaseDoc } from "@/types/document-homepage";

type GroupInput = { name: string; items: BaseDoc[] };
type GroupNormalized = { name: string; items: BaseDoc[] };

export default function SpecializationsBlock({
  groups,
  defaultGroupsPerPage = 2,
  maxItemsPerGroup = 12,
  disablePager = false,
}: {
  groups: GroupInput[];
  defaultGroupsPerPage?: number;
  maxItemsPerGroup?: number;
  disablePager?: boolean;
}) {
  const { q } = useHomepage();
  const { open } = useModalPreview();

  const normalizedGroups: GroupNormalized[] = useMemo(() => {
    return (groups ?? []).map((g) => ({
      name: g.name,
      items: (g.items ?? []).map((d) => ({
        ...d,
        viewCount: (d as any).viewCount ?? 0,
      })),
    }));
  }, [groups]);

  // Filter theo q
  const filtered: GroupNormalized[] = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return normalizedGroups;
    return normalizedGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((d) => {
          const pts = (d.points ?? "").toString();
          return (
            d.title.toLowerCase().includes(s) ||
            d.uploader.toLowerCase().includes(s) ||
            d.specialization.toLowerCase().includes(s) ||
            d.orgName.toLowerCase().includes(s) ||
            pts.includes(s)
          );
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, normalizedGroups]);

  // ================================
  // Trường hợp disablePager = true
  // ================================
  if (disablePager) {
    if (!filtered.length) {
      return (
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeader}>Specializations</div>
          </div>
          <EmptyState
            title="No specializations match your search"
            description="Try a different keyword or clear filters."
          />
        </section>
      );
    }
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>Specializations</div>
        </div>

        {filtered.map((g) => (
          <div key={g.name} className={styles.specBlock}>
            <div className={styles.specTitle}>{g.name}</div>
            <HorizontalScroll>
              {(maxItemsPerGroup > 0
                ? g.items.slice(0, maxItemsPerGroup)
                : g.items
              ).map((d) => (
                <DocCard key={d.id} {...d} onPreview={() => open(d)} />
              ))}
            </HorizontalScroll>
          </div>
        ))}
      </section>
    );
  }

  // ================================
  // Trường hợp có pager client-side
  // ================================
  const [size, setSize] = useState(Math.max(1, defaultGroupsPerPage || 1));
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / Math.max(1, size)),
  );
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * Math.max(1, size);
  const visibleGroups = filtered.slice(start, start + Math.max(1, size));

  // Khi q hoặc groups đổi → về page 1
  useEffect(() => {
    if (clampedPage !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, groups]);

  if (!filtered.length) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>Specializations</div>
        </div>
        <EmptyState
          title="No specializations match your search"
          description="Try a different keyword or clear filters."
        />
      </section>
    );
  }

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
                const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                setSize(n);
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
          <div className={styles.specTitle}>{g.name}</div>
          <HorizontalScroll>
            {(maxItemsPerGroup > 0
              ? g.items.slice(0, maxItemsPerGroup)
              : g.items
            ).map((d) => (
              <DocCard key={d.id} {...d} onPreview={() => open(d)} />
            ))}
          </HorizontalScroll>
        </div>
      ))}
    </section>
  );
}
