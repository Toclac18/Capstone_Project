"use client";

import { useMemo } from "react";
import { useSearch } from "../provider";
import styles from "../styles.module.css";

export default function DocumentList() {
  const { items, loading } = useSearch();

  if (loading) {
    return <div className={styles.skeleton}>Loading…</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.listWrapper}>
        <p className={styles.empty}>There is no document existed!</p>
      </div>
    );
  }

  return (
    <div className={styles.listWrapper}>
      <ul className={styles.cardGrid}>
        {items.map((doc) => {
          const thumb = doc.thumbnailUrl || null;
          const firstLetter = doc.title?.trim().charAt(0).toUpperCase() || "?";

          const description = doc.description;

          // format ngày tạo
          const createdAt = useMemo(() => {
            try {
              return new Date(doc.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
              });
            } catch {
              return doc.createdAt;
            }
          }, [doc.createdAt]);

          const isPremium = doc.isPremium;
          const priceLabel = isPremium
            ? `${doc.price?.toLocaleString?.() ?? doc.price} pts`
            : "Miễn phí";

          return (
            <li className={styles.card} key={doc.id}>
              {/* Thumbnail bên trái */}
              <div className={styles.cardThumbWrapper}>
                {thumb ? (
                  <img
                    src={thumb}
                    alt={doc.title}
                    loading="lazy"
                    className={styles.cardThumb}
                  />
                ) : (
                  <div className={styles.cardThumbFallback}>{firstLetter}</div>
                )}
              </div>

              {/* Khối nội dung chính */}
              <div className={styles.cardMain}>
                {/* Title + badge bên phải */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{doc.title}</h3>

                  <div className={styles.cardHeaderRight}>
                    <span
                      className={
                        isPremium ? styles.priceBadge : styles.freeBadge
                      }
                    >
                      {priceLabel}
                    </span>
                    <span className={styles.badge}>{doc.docTypeName}</span>
                  </div>
                </div>

                {/* Dòng meta trên cùng: tổ chức + domain + chuyên ngành */}
                <div className={styles.cardMetaTopRow}>
                  {doc.organizationName && (
                    <span className={styles.metaValue}>
                      <span className={styles.metaLabel}>Organization:</span>{" "}
                      {doc.organizationName}
                    </span>
                  )}

                  <span className={styles.metaValue}>
                    <span className={styles.metaLabel}>Domain:</span>{" "}
                    {doc.domainName}
                  </span>

                  <span className={styles.metaValue}>
                    <span className={styles.metaLabel}>Specialization:</span>{" "}
                    {doc.specializationName}
                  </span>
                </div>

                {/* Mô tả / tóm tắt */}
                {description && (
                  <p className={styles.cardDescription}>{description}</p>
                )}

                {/* Tags */}
                {doc.tagNames && doc.tagNames.length > 0 && (
                  <div className={styles.tagRow}>
                    {doc.tagNames.map((tag) => (
                      <span className={styles.tagChip} key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: uploader + stats */}
                <div className={styles.cardFooterRow}>
                  <span className={styles.metaValue}>
                    <span className={styles.metaLabel}>Uploader:</span>{" "}
                    {doc.uploader.fullName}
                  </span>
                  <span className={styles.metaValue}>
                    <span className={styles.metaLabel}>Upload date:</span>{" "}
                    {createdAt}
                  </span>
                  <span className={styles.metaValue}>
                    <span className={styles.metaLabel}>Total view(s):</span>{" "}
                    {doc.viewCount}
                  </span>
                  <span className={styles.metaValue}>
                    <span className={styles.metaLabel}>Upvote:</span>{" "}
                    {doc.upvoteCount}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
