"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearch } from "../provider";
import styles from "../styles.module.css";

export default function DocumentList() {
  const { items, loading, perPage, page, setPage } = useSearch();
  const [q, setQ] = useState("");

  // Read search input value (current-page search only)
  useEffect(() => {
    const el = document.getElementById("__search_q") as HTMLInputElement | null;
    if (!el) return;
    const read = () => setQ(el.value);
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ["value"] });
    read();
    return () => observer.disconnect();
  }, []);

  const { paged } = useMemo(() => {
    const paged = items;

    // Client-only search within current page data
    const query = q.trim().toLowerCase();
    const filtered = !query
      ? paged
      : paged.filter((d) =>
          [d.title, d.orgName, d.specialization, d.uploader]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );

    return { paged: filtered };
  }, [items, perPage, page, q]);

  useEffect(() => {
    if (page < 1) setPage(1);
  }, [page, setPage]);

  if (loading) return <div className={styles.skeleton}>Loading…</div>;

  return (
    <div className={styles.listWrapper}>
      {paged.length === 0 ? (
        <p className={styles.empty}>
          No documents on this page match your search.
        </p>
      ) : (
        <ul className={styles.cardGrid}>
          {paged.map((d) => {
            // Thumbnail: support a few possible backend keys via `any`
            const anyDoc = d as any;
            const thumb: string | null =
              anyDoc.thumbnail ||
              anyDoc.thumbnailUrl ||
              anyDoc.thumbUrl ||
              null;

            // Optional score, if votes are available
            const upvotes: number = anyDoc.upvote_counts ?? anyDoc.upvotes ?? 0;
            const downvotes: number =
              anyDoc.downvote_counts ?? anyDoc.downvotes ?? 0;
            const totalVotes = upvotes + downvotes;
            const score =
              totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : null;

            const description: string =
              d.description || anyDoc.summarizations?.short || "";

            const firstLetter =
              (d.title && d.title.trim().charAt(0).toUpperCase()) || "?";

            return (
              <li className={styles.card} key={d.id}>
                {/* Thumbnail on the left */}
                <div className={styles.cardThumbWrapper}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={d.title}
                      loading="lazy"
                      className={styles.cardThumb}
                    />
                  ) : (
                    <div className={styles.cardThumbFallback}>
                      {firstLetter}
                    </div>
                  )}
                </div>

                {/* Main text content */}
                <div className={styles.cardMain}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{d.title}</h3>
                    <span className={styles.badge}>{d.publicYear}</span>
                  </div>

                  {description && (
                    <p className={styles.cardDescription}>{description}</p>
                  )}

                  <div className={styles.cardMetaGroup}>
                    {/* Organization row */}
                    <div className={styles.cardMetaRow}>
                      <span className={styles.metaLabel}>Organization:</span>
                      <span className={styles.metaValue}>{d.orgName}</span>
                    </div>

                    <div className={styles.cardMetaRow}>
                      <span className={styles.metaLabel}>Domain: </span>
                      <span className={styles.metaValue}>{d.domain}</span>
                      <span className={styles.metaLabel}>Specialization: </span>
                      <span className={styles.metaValue}>
                        {d.specialization}
                      </span>
                    </div>

                    <div className={styles.cardMetaRow}>
                      <span className={styles.metaLabel}>Uploader: </span>
                      <span className={styles.metaValue}>{d.uploader}</span>
                    </div>
                  </div>
                </div>

                {/* Right-side score like Studocu, if votes exist */}
                {score !== null && (
                  <div className={styles.cardRight}>
                    <div className={styles.scorePill}>
                      {score}%
                      {totalVotes > 0 && (
                        <span className={styles.scoreCount}>
                          ({totalVotes})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
