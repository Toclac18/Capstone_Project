"use client";

import { useState, MouseEvent, KeyboardEvent, useRef, useEffect } from "react";
import styles from "../styles.module.css";
import type { DocumentItem } from "@/types/document-homepage";
import SaveListModal from "@/components/SaveListModal/SaveListModal";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { MoreVertical, ThumbsUp, Bookmark, Share2 } from "lucide-react";

const THUMBNAIL_BASE_URL =
  "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/doc-thumbs/";
const DEFAULT_THUMBNAIL = "/images/document.jpg";

type Props = DocumentItem & {
  onPreview?: (doc: DocumentItem) => void;
};

export default function DocCard(props: Props) {
  const {
    title,
    uploader,
    upvote_counts,
    viewCount,
    thumbnail,
    isPremium,
    onPreview,
  } = props;

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handlePreview = () => onPreview?.(props);

  const handleMenuClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleOpenSaveModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsSaveModalOpen(true);
  };

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePreview();
    }
  };

  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Get sanitized thumbnail URL
  const thumbnailUrl =
    sanitizeImageUrl(thumbnail, THUMBNAIL_BASE_URL, DEFAULT_THUMBNAIL) ||
    DEFAULT_THUMBNAIL;

  // Format view count
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <>
      <div
        className={styles.card}
        role="button"
        tabIndex={0}
        onClick={handlePreview}
        onKeyDown={handleCardKeyDown}
        aria-label={`Preview ${title}`}
      >
        {/* Thumbnail */}
        <div className={styles.thumb}>
          <span className={styles.pdfBadge}>PDF</span>
          <img
            src={thumbnailUrl}
            alt={title}
            className={styles.thumbImg}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== DEFAULT_THUMBNAIL) {
                target.src = DEFAULT_THUMBNAIL;
              }
            }}
          />
        </div>

        {/* Card Info */}
        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardUploader}>Added by {uploader}</p>

          {/* Stats row: views + ratings */}
          <div className={styles.cardStats}>
            <span className={styles.cardViews}>
              {formatViews(viewCount || 0)} views
            </span>
            <span className={styles.cardDot}>•</span>
            <span className={styles.cardLikes}>
              <ThumbsUp className={styles.ratingIcon} />
              {upvote_counts} ratings
            </span>
          </div>

          {/* Menu button */}
          <div className={styles.cardFooter}>
            <div className={styles.menuWrapper} ref={menuRef}>
              <button
                type="button"
                className={styles.menuBtn}
                onClick={handleMenuClick}
                aria-label="More options"
              >
                <MoreVertical className={styles.menuIcon} />
              </button>

              {showMenu && (
                <div className={styles.menuDropdown}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleOpenSaveModal}
                  >
                    <Bookmark className={styles.menuItemIcon} />
                    Save to list
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (navigator.share) {
                        navigator.share({
                          title: title,
                          url: window.location.href,
                        });
                      }
                    }}
                  >
                    <Share2 className={styles.menuItemIcon} />
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSaveModalOpen && (
        <SaveListModal
          isOpen={isSaveModalOpen}
          onClose={handleCloseSaveModal}
          docId={props.id}
        />
      )}
    </>
  );
}
