"use client";

import { useMemo } from "react";
import { useSearch } from "../provider";
import styles from "../styles.module.css";
import { useModalPreview } from "@/components/ModalPreview/Provider";
import type { DocumentSearchItem } from "@/types/document-search";

/**
 * Map DocumentSearchItem → ModalPreviewDoc
 * để dùng với ModalPreview
 */
function toModalPreviewDoc(doc: DocumentSearchItem) {
  const created = new Date(doc.createdAt);
  const publicYear = Number.isNaN(created.getTime())
    ? undefined
    : created.getFullYear();

  return {
    id: doc.id,
    title: doc.title,
    orgName: doc.organizationName,
    specialization: doc.specializationName,
    publicYear,
    uploader: doc.uploader.fullName,
    isPremium: doc.isPremium,
    points: doc.price,
    thumbnail: doc.thumbnailUrl || undefined,
    description: doc.description,
    summarizations: doc.summarizations
      ? {
          short: doc.summarizations.shortSummary ?? undefined,
          medium: doc.summarizations.mediumSummary ?? undefined,
          detailed: doc.summarizations.detailedSummary ?? undefined,
        }
      : undefined,
    pageCount: undefined,
    viewCount: doc.viewCount,
    views: doc.viewCount,
    upvote_counts: doc.upvoteCount,
    upvotes: doc.upvoteCount,
    downvote_counts: 0,
    downvotes: 0,
  };
}

export default function DocumentList() {
  const { items, loading } = useSearch();
  const { open } = useModalPreview();

  if (loading) {
    return <div className={styles.skeleton}>Loading document…</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.listWrapper}>
        <p className={styles.empty}>No document found!!!</p>
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
            : "PUBLIC";

          const handleOpen = () => {
            open(toModalPreviewDoc(doc));
          };

          const onKey = (e: React.KeyboardEvent<HTMLLIElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpen();
            }
          };

          return (
            <li
              key={doc.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={handleOpen}
              onKeyDown={onKey}
            >
              {/* Thumbnail bên trái */}
              <div className={styles.cardThumbWrapper}>
                {thumb ? (
                  // dùng <img> thường để tránh ràng buộc của next/image trong list đơn giản
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
                    <span className={styles.metaLabel}>Majority:</span>{" "}
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
