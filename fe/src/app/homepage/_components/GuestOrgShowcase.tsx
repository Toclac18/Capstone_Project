"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/document-homepage";

export default function GuestOrgShowcase() {
  const { topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();

  const groups = useMemo(() => {
    const all: DocumentItem[] = [
      ...(topUpvoted ?? []),
      ...specGroups.flatMap((g) => g.items),
    ];

    const byOrg = new Map<string, DocumentItem[]>();

    for (const d of all) {
      const org = d.orgName ?? "Independent authors";
      const list = byOrg.get(org) ?? [];
      if (!list.find((x) => x.id === d.id)) {
        list.push(d);
      }
      byOrg.set(org, list);
    }

    return Array.from(byOrg.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 2)
      .map(([orgName, items]) => ({
        orgName,
        items: items.slice(0, 3),
      }));
  }, [topUpvoted, specGroups]);

  if (!groups.length) return null;

  return (
    <section className={`${styles.section} ${styles.orgSection}`}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>Hot organizations</div>
      </div>

      <div className={styles.orgGrid}>
        {groups.map((g) => (
          <div key={g.orgName} className={styles.orgColumn}>
            <div className={styles.orgTitle}>{g.orgName}</div>
            <div className={styles.orgCards}>
              {g.items.map((d) => (
                <DocCard key={d.id} {...d} onPreview={() => open(d)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
