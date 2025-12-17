"use client";

import { useMemo } from "react";
import { useSearch } from "../provider";
import styles from "../styles.module.css";
import { useModalPreview } from "@/components/ModalPreview/Provider";
import type { DocumentSearchItem } from "@/types/document-search";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { Crown, Eye, ThumbsUp, Calendar, User, SearchX } from "lucide-react";

const THUMBNAIL_BASE_URL =
  "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/doc-thumbs/";
const DEFAULT_THUMBNAIL = "/images/document.jpg";

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
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <SearchX size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No documents found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listWrapper}>
      <ul className={styles.cardGrid}>
        {items.map((doc) => {
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

          // Get sanitized thumbnail URL
          const thumbnailUrl = sanitizeImageUrl(
            doc.thumbnailUrl,
            THUMBNAIL_BASE_URL,
            DEFAULT_THUMBNAIL
          );

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
                {isPremium && (
                  <span className={styles.premiumIcon}>
                    <Crown size={14} />
                  </span>
                )}
                <img
                  src={thumbnailUrl || DEFAULT_THUMBNAIL}
                  alt={doc.title}
                  loading="lazy"
                  className={styles.cardThumb}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== DEFAULT_THUMBNAIL) {
                      target.src = DEFAULT_THUMBNAIL;
                    }
                  }}
                />
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
                      {isPremium ? "Premium" : "Free"}
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
                  <span className={styles.footerItem}>
                    <User size={14} className={styles.footerIcon} />
                    {doc.uploader.fullName}
                  </span>
                  <span className={styles.footerItem}>
                    <Calendar size={14} className={styles.footerIcon} />
                    {createdAt}
                  </span>
                  <span className={styles.footerItem}>
                    <Eye size={14} className={styles.footerIcon} />
                    {doc.viewCount} views
                  </span>
                  <span className={styles.footerItem}>
                    <ThumbsUp size={14} className={styles.footerIcon} />
                    {doc.upvoteCount} likes
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
