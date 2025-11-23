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
          {paged.map((d) => (
            <li className={styles.card} key={d.id}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{d.title}</h3>
                <span className={styles.badge}>{d.publicYear}</span>
              </div>
              <div className={styles.cardMeta}>
                <div>
                  <span className={styles.metaLabel}>Organization:</span>{" "}
                  {d.orgName}
                </div>
                <div>
                  <span className={styles.metaLabel}>Domain:</span> {d.domain}
                </div>
                <div>
                  <span className={styles.metaLabel}>Specialization:</span>{" "}
                  {d.specialization}
                </div>
                <div>
                  <span className={styles.metaLabel}>Uploader:</span>{" "}
                  {d.uploader}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
