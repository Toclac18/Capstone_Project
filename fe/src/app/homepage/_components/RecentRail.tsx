"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import HorizontalScroll from "./HorizontalScroll";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/document-homepage";

export default function RecentRail() {
  const { continueReading, topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();

  const items = useMemo<DocumentItem[]>(() => {
    const all: DocumentItem[] = [
      ...continueReading,
      ...topUpvoted,
      ...specGroups.flatMap((g) => g.items),
    ];
    const seen = new Set<string>();
    const unique = all.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    unique.sort((a, b) => (b.publicYear || 0) - (a.publicYear || 0));

    return unique.slice(0, 12).map((d) => ({
      ...d,
      viewCount: (d as any).viewCount ?? 0,
    }));
  }, [continueReading, topUpvoted, specGroups]);

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Recently added</div>
      </div>
      <HorizontalScroll>
        {items.map((d) => (
          <DocCard key={d.id} {...d} onPreview={() => open(d)} />
        ))}
      </HorizontalScroll>
    </section>
  );
}
