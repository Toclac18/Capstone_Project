"use client";

import styles from "../styles.module.css";
import DocCard, { type DocCardItem } from "./DocCard";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import type { DocumentItem } from "@/types/documentResponse";

type OrgGroup = { orgName: string; items: DocCardItem[] };

export default function OrgHighlights() {
  const { continueReading, topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();

  const groups = useMemo<OrgGroup[]>(() => {
    const all: DocumentItem[] = [
      ...continueReading,
      ...topUpvoted,
      ...specGroups.flatMap((g) => g.items),
    ];
    const byOrg = new Map<string, DocCardItem[]>();
    for (const d of all) {
      const org = (d as any).orgName ?? "Unknown organization";
      const list = byOrg.get(org) ?? [];
      if (!list.find((x) => x.id === d.id)) {
        list.push({ ...d, viewCount: (d as any).viewCount ?? 0 });
      }
      byOrg.set(org, list);
    }
    const entries = Array.from(byOrg.entries())
      .filter(([, items]) => items.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 2);

    return entries.map(([orgName, items]) => ({
      orgName,
      items: items.slice(0, 3),
    }));
  }, [continueReading, topUpvoted, specGroups]);

  if (!groups.length) return null;

  return (
    <section className={`${styles.section} ${styles.orgSection}`}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>From your organizations</div>
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
