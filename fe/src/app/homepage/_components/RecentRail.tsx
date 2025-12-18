"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import HorizontalScroll from "./HorizontalScroll";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/document-homepage";

export default function RecentRail() {
  const { continueReading, topUpvoted, allSpecGroups } = useHomepage();
  const { open } = useModalPreview();

  // Sort theo updatedAt descending (recently added)
  // Sử dụng allSpecGroups thay vì specGroups để có đầy đủ documents từ tất cả groups
  const items = useMemo<DocumentItem[]>(() => {
    // Flatten all documents from ALL specGroups (not just visible ones)
    const all: DocumentItem[] = [
      ...allSpecGroups.flatMap((g) => g.items),
      ...topUpvoted,
      ...continueReading,
    ];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = all.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    // Sort by updatedAt descending (most recent first)
    unique.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    return unique.slice(0, 12);
  }, [continueReading, topUpvoted, allSpecGroups]);

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
