"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/documentResponse";

export default function GuestPopularStrip() {
  const { topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();

  const items = useMemo(() => {
    const base: DocumentItem[] = [
      ...(topUpvoted ?? []),
      ...specGroups.flatMap((g) => g.items),
    ];

    const seen = new Set<string>();
    const unique = base.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    unique.sort((a, b) => (b.upvote_counts ?? 0) - (a.upvote_counts ?? 0));

    return unique.slice(0, 8);
  }, [topUpvoted, specGroups]);

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Popular right now</div>
      </div>

      <div className={styles.horizontalScroll}>
        {items.map((d) => (
          <div key={d.id} className={styles.horizontalCardWrap}>
            <DocCard key={d.id} {...d} onPreview={() => open(d)} />
          </div>
        ))}
      </div>
    </section>
  );
}
