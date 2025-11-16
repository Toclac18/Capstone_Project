// src/app/docs-view/[id]/_components/HeaderBar.tsx
"use client";

import { Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

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
    voteLoading,
    handleUpvote,
    handleDownvote,
  } = useDocsView();

  if (!detail) return null;

  const isPremiumLocked = detail.isPremium && !redeemed;
  const canDownload = !detail.isPremium;
  const points = detail.points ?? 0;

  return (
    <>
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.stat2}>
            <Eye size={18} className={styles.statIcon} />
            <span>{detail.viewCount}</span>
          </div>
          <button
            type="button"
            className={styles.statButton}
            disabled={voteLoading}
            onClick={handleUpvote}
          >
            <ThumbsUp size={18} className={styles.statIcon} />
            <span>{detail.upvote_counts}</span>
          </button>
          <button
            type="button"
            className={styles.statButton}
            disabled={voteLoading}
            onClick={handleDownvote}
          >
            <ThumbsDown size={18} className={styles.statIcon} />
            <span>{detail.downvote_counts}</span>
          </button>
        </div>

        {/* zoom + search giữ nguyên */}
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

        <div className={styles.headerRight}>
          <button className={styles.btnGhost}>Save</button>

          {isPremiumLocked ? (
            <button className={styles.btnRedeem} onClick={openRedeemModal}>
              Redeem
            </button>
          ) : canDownload ? (
            <Link href={detail.fileUrl} className={styles.btnPrimary} download>
              Download
            </Link>
          ) : (
            <button className={styles.btnDisabled}>Download</button>
          )}
        </div>
      </div>

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
    </>
  );
}
