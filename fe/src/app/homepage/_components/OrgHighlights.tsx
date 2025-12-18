"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DocumentItem } from "@/types/document-homepage";

type OrgGroup = { orgName: string; items: DocumentItem[] };

export default function OrgHighlights() {
  const { continueReading, topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();
  const router = useRouter();

  const groups = useMemo<OrgGroup[]>(() => {
    const all: DocumentItem[] = [
      ...continueReading,
      ...topUpvoted,
      ...specGroups.flatMap((g) => g.items),
    ];
    const byOrg = new Map<string, DocumentItem[]>();
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
        <div>
          <div className={styles.sectionHeader}>From your organizations</div>
          <div className={styles.sectionSub}>
            Recent activity and recommended reads from organizations you follow
          </div>
        </div>
      </div>

      <div className={styles.orgGrid}>
        {groups.map((g) => (
          <div key={g.orgName} className={styles.orgColumn}>
            <div className={styles.orgHeaderRow}>
              <div className={styles.orgHeaderLeft}>
                <div className={styles.orgLogo} aria-hidden>
                  {g.orgName
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join("")}
                </div>
                <div>
                  <div className={styles.orgTitle}>{g.orgName}</div>
                  <div className={styles.orgMeta}>
                    {g.items.length} recent docs
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() =>
                  router.push(`/search#org=${encodeURIComponent(g.orgName)}`)
                }
              >
                View all
              </button>
            </div>

            <div className={styles.orgCardsRow}>
              {g.items.map((d) => (
                <div key={d.id} className={styles.horizontalCardWrap}>
                  <DocCard {...d} onPreview={() => open(d)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
