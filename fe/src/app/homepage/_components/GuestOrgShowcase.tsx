"use client";

import styles from "../styles.module.css";
import DocCard from "./DocCard";
import { useHomepage } from "../provider";
import { useModalPreview } from "@/components/ModalPreview";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DocumentItem } from "@/types/document-homepage";

export default function GuestOrgShowcase() {
  const { topUpvoted, specGroups } = useHomepage();
  const { open } = useModalPreview();
  const router = useRouter();

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
        <div>
          <div className={styles.sectionHeader}>Hot organizations</div>
          <div className={styles.sectionSub}>
            Discover active contributors and their top docs
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
                    {g.items.length} featured docs
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
