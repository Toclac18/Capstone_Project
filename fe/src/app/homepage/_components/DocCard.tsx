"use client";

import Image from "next/image";
import { useState, MouseEvent, KeyboardEvent } from "react";
import styles from "../styles.module.css";
import type { DocumentItem as BaseDoc } from "@/types/documentResponse";
import SaveListModal from "@/components/SaveListModal/SaveListModal";

export type DocCardItem = BaseDoc & { viewCount: number };

type Props = DocCardItem & {
  onPreview?: (doc: DocCardItem) => void;
};

export default function DocCard(props: Props) {
  const {
    title,
    orgName,
    domain,
    specialization,
    uploader,
    publicYear,
    isPremium,
    points,
    upvote_counts,
    downvote_counts,
    thumbnail,
    viewCount,
    onPreview,
  } = props;

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handlePreview = () => onPreview?.(props);

  const handleOpenSaveModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsSaveModalOpen(true);
  };

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePreview();
    }
  };

  const handleSaveButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
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
        <div className={styles.thumb}>
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 80vw, 260px"
            className={styles.thumbImg}
          />

          <button
            type="button"
            className={styles.saveBtn}
            aria-label="Save document"
            onClick={handleOpenSaveModal}
            onKeyDown={handleSaveButtonKeyDown}
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={styles.saveIcon}
            >
              <path
                d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5V17l-4.5-2.7L6 17V3.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className={styles.cardTitle}>{title}</div>

        <div className={styles.meta}>
          <div>• {viewCount.toLocaleString()} views</div>
          <div>• {orgName}</div>
          <div>• Public on {publicYear}</div>
        </div>

        <div className={styles.votesRow}>
          <span className={styles.voteUp}>▲ {upvote_counts}</span>
          <span className={styles.voteDown}>▼ {downvote_counts}</span>
        </div>

        {isPremium && (
          <div className={styles.meta}>
            <span className={styles.specChip}>Premium • {points} pts</span>
          </div>
        )}

        {/* Only 1 domain + 1 specialization */}
        <div className={styles.cardTags}>
          <span className={styles.tagPill}>{domain}</span>
          <span className={styles.tagPill}>{specialization}</span>
        </div>

        <div className={styles.uploader}>Uploaded by {uploader}</div>
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
