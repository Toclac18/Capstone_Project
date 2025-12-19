"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import HorizontalScroll from "./HorizontalScroll";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/document-homepage";

function buildRecommended(
  continueReading: DocumentItem[],
  topUpvoted: DocumentItem[],
  specGroups: { name: string; items: DocumentItem[] }[],
): DocumentItem[] {
  const base: DocumentItem[] = [...topUpvoted];

  if (!base.length && specGroups.length) {
    base.push(...specGroups.flatMap((g) => g.items));
  }
  if (!base.length) {
    base.push(...continueReading);
  }

  const seen = new Set<string>();
  const unique = base.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  return unique.slice(0, 12).map((d) => ({
    ...d,
    viewCount: (d as any).viewCount ?? 0,
  }));
}

export default function RecommendedStrip() {
  const { continueReading, topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();

  const items = useMemo(
    () => buildRecommended(continueReading, topUpvoted, specGroups),
    [continueReading, topUpvoted, specGroups],
  );

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Recommended for you</div>
      </div>
      <HorizontalScroll>
        {items.map((d) => (
          <DocCard key={d.id} {...d} onPreview={() => open(d)} />
        ))}
      </HorizontalScroll>
    </section>
  );
}
