// src/app/docs-view/[id]/_components/HeaderBar.tsx
"use client";

import { useState } from "react";
import { Eye, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/utils";

import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";
import SaveListModal from "@/components/SaveListModal/SaveListModal";
import { useRouter } from "next/navigation";

export default function HeaderBar() {
  const router = useRouter();
  const {
    detail,
    zoomIn,
    zoomOut,
    query,
    setQuery,
    hits,
    goNextHit,
    goPrevHit,
    userVote,
    voteLoading,
    handleUpvote,
    handleDownvote,
  } = useDocsView();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  if (!detail) return null;

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  // 4. Hàm xử lý chuyển hướng Report
  const handleReport = () => {
    // detail.id chính là ID của document hiện tại
    router.push(`/document-report/${detail.id}`);
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

        {/* RIGHT: Report + Save + Download */}
        <div className={styles.headerRight}>
          {/* 5. Nút Report */}
          <button
            type="button"
            className={styles.btnGhost}
            onClick={handleReport}
            title="Report this document"
          >
            {/* Bỏ className="mr-1" vì đã có gap trong CSS */}
            <Flag size={16} />
            <span>Report</span>
          </button>

          {/* Save */}
          <button
            type="button"
            className={styles.btnGhost}
            onClick={handleOpenSaveModal}
          >
            Save
          </button>

          {detail.fileUrl ? (
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
