// src/app/docs-view/[id]/_components/RightSidebar.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";

export default function RightSidebar() {
  const { related } = useDocsView();

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.rightHeader}>Similar in specialization</div>
      <ul className={styles.relatedList} role="list">
        {related.map((d) => (
          <li key={d.id} className={styles.relatedItem}>
            <Link className={styles.relatedLink} href={`/docs-view/${d.id}`}>
              <div className={styles.relatedThumb}>
                <Image
                  src={d.thumbnail || "/placeholder-thumbnail.png"}
                  alt={d.title}
                  fill
                  sizes="80px"
                />
              </div>
              <div className={styles.relatedMeta}>
                <div className={styles.relatedTitle}>{d.title}</div>
                <div className={styles.relatedOrg}>{d.orgName}</div>
                <div className={styles.relatedVotes}>
                  ▲ {d.upvote_counts} • ▼ {d.downvote_counts}
                </div>
              </div>
              {d.isPremium && (
                <span className={styles.premiumTag}>Premium</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
