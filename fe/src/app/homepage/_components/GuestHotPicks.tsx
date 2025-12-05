"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/document-homepage";

export default function GuestHotPicks() {
  const { specGroups } = useHomepage();
  const { open } = useModalPreview();

  const items = useMemo(() => {
    const all: DocumentItem[] = specGroups.flatMap((g) => g.items);
    const seen = new Set<string>();

    const unique = all.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    unique.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

    return unique.slice(0, 8);
  }, [specGroups]);

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Hot picks for learners</div>
      </div>

      <div className={styles.cardsGrid}>
        {items.map((d) => (
          <DocCard key={d.id} {...d} onPreview={() => open(d)} />
        ))}
      </div>
    </section>
  );
}
