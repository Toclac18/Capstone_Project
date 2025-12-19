"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import HorizontalScroll from "./HorizontalScroll";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/document-homepage";

export default function GuestPopularStrip() {
  const { topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();

  // Hiển thị đúng thứ tự response của BE trả về (không sort lại)
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

    return unique.slice(0, 12);
  }, [topUpvoted, specGroups]);

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Popular right now</div>
      </div>

      <HorizontalScroll>
        {items.map((d) => (
          <DocCard key={d.id} {...d} onPreview={() => open(d)} />
        ))}
      </HorizontalScroll>
    </section>
  );
}
