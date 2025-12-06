// src/app/docs-view/[id]/_components/HeaderBar.tsx
"use client";

import { useState } from "react";
import { Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/utils";

import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import SaveListModal from "@/components/SaveListModal/SaveListModal";

export default function HeaderBar() {
  const {
    detail,
    zoomIn,
    zoomOut,
    query,
    setQuery,
    hits,
    goNextHit,
    goPrevHit,
    redeemed,
    isRedeemModalOpen,
    redeemLoading,
    openRedeemModal,
    closeRedeemModal,
    redeem,
    userVote,
    voteLoading,
    handleUpvote,
    handleDownvote,
  } = useDocsView();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  if (!detail) return null;

  // premium + chưa redeem => tài liệu vẫn bị khóa
  const isPremiumLocked = detail.isPremium && !redeemed;
  // có thể download khi không bị khóa (free hoặc premium đã redeem)
  const canDownload = !isPremiumLocked;
  const points = detail.points ?? 0;

  const handleOpenSaveModal = () => {
    if (isPremiumLocked) return;
    setIsSaveModalOpen(true);
  };

  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  return (
    <>
      <div className={styles.headerBar}>
        {/* LEFT: stats */}
        <div className={styles.headerLeft}>
          <div className={styles.stat2}>
            <Eye size={18} className={styles.statIcon} />
            <span>{detail.viewCount}</span>
          </div>
          <button
            type="button"
            className={cn(
              styles.statButton,
              userVote === 1 && styles.statButtonActive,
            )}
            disabled={voteLoading}
            onClick={handleUpvote}
            title={userVote === 1 ? "Remove upvote" : "Upvote"}
            data-vote={userVote}
          >
            <ThumbsUp size={18} className={styles.statIcon} />
            <span>{detail.upvote_counts}</span>
          </button>
          <button
            type="button"
            className={cn(
              styles.statButton,
              userVote === -1 && styles.statButtonActive,
            )}
            disabled={voteLoading}
            onClick={handleDownvote}
            title={userVote === -1 ? "Remove downvote" : "Downvote"}
            data-vote={userVote}
          >
            <ThumbsDown size={18} className={styles.statIcon} />
            <span>{detail.downvote_counts}</span>
          </button>
        </div>

        {/* CENTER: zoom + search */}
        <div className={styles.headerCenter}>
          <button
            className={styles.iconBtn}
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            className={styles.iconBtn}
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            ＋
          </button>

          <div className={styles.findWrap}>
            <input
              className={styles.findInput}
              placeholder="Find in document…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className={styles.findMeta}>
              {hits.length ? `${hits.length} match` : "0 match"}
              <button
                className={styles.findNav}
                onClick={goPrevHit}
                disabled={!hits.length}
              >
                Prev
              </button>
              <button
                className={styles.findNav}
                onClick={goNextHit}
                disabled={!hits.length}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Save + Redeem / Download */}
        <div className={styles.headerRight}>
          {/* Save – disable khi premium chưa redeem */}
          <button
            type="button"
            className={`${styles.btnGhost} ${
              isPremiumLocked ? styles.btnDisabled : ""
            }`}
            disabled={isPremiumLocked}
            onClick={handleOpenSaveModal}
          >
            Save
          </button>

          {isPremiumLocked ? (
            <button
              type="button"
              className={styles.btnRedeem}
              onClick={openRedeemModal}
            >
              Redeem
            </button>
          ) : canDownload && detail.fileUrl ? (
            <Link href={detail.fileUrl} className={styles.btnPrimary} download>
              Download
            </Link>
          ) : (
            <button type="button" className={styles.btnDisabled}>
              Download
            </button>
          )}
        </div>
      </div>

      {/* Modal Redeem */}
      <ConfirmModal
        open={isPremiumLocked && isRedeemModalOpen}
        title="Redeem document"
        content={`You will spend ${points} points to unlock this document.`}
        subContent="After payment, this document will appear in your library and you won't need to purchase it again."
        confirmLabel="Redeem"
        cancelLabel="Cancel"
        loading={redeemLoading}
        onConfirm={redeem}
        onCancel={closeRedeemModal}
      />

      {/* Modal SaveList */}
      {detail && (
        <SaveListModal
          isOpen={isSaveModalOpen}
          onClose={handleCloseSaveModal}
          docId={detail.id}
        />
      )}
    </>
  );
}
