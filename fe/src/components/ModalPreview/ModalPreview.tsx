"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThumbsUp, ThumbsDown, Eye, Crown, Loader2 } from "lucide-react";
import styles from "./styles.module.css";
import { useModalPreview } from "./Provider";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { redeemDoc, fetchDocumentUserInfo } from "@/services/document.service";
import { useToast } from "@/components/ui/toast";

type Level = "short" | "medium" | "detailed";

const THUMB_BASE_URL =
  "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/doc-thumbs/";

export default function ModalPreview() {
  const router = useRouter();
  const { isOpen, doc, close } = useModalPreview();
  const [level, setLevel] = useState<Level>("short");
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const { showToast } = useToast();

  // Fetch userInfo khi mở modal để có data mới nhất từ DB
  useEffect(() => {
    if (isOpen && doc?.id) {
      setLevel("short");
      setIsRedeemModalOpen(false);

      // Nếu là free doc, không cần fetch userInfo
      if (!doc.isPremium) {
        setHasRedeemed(true);
        return;
      }

      // Fetch userInfo từ API
      setUserInfoLoading(true);
      fetchDocumentUserInfo(String(doc.id))
        .then((userInfo) => {
          if (userInfo) {
            setHasRedeemed(userInfo.hasRedeemed || userInfo.isUploader);
          } else {
            // Guest user hoặc lỗi - mặc định chưa redeem
            setHasRedeemed(false);
          }
        })
        .catch(() => {
          setHasRedeemed(false);
        })
        .finally(() => {
          setUserInfoLoading(false);
        });
    }
  }, [isOpen, doc?.id, doc?.isPremium]);

  const summaryForLevel = useMemo(() => {
    if (!doc?.summarizations) return "";
    const { short, medium, detailed } = doc.summarizations;

    const pick = (lv: Level) =>
      (lv === "short" && short) ||
      (lv === "medium" && medium) ||
      (lv === "detailed" && detailed) ||
      "";

    const val = pick(level);
    if (val) return val;

    if (level !== "short" && short) return short;
    if (level !== "medium" && medium) return medium;
    if (level !== "detailed" && detailed) return detailed;
    return "";
  }, [doc?.summarizations, level]);

  if (!isOpen || !doc) return null;

  const thumbnailUrl = sanitizeImageUrl(
    doc.thumbnail,
    THUMB_BASE_URL,
    "/placeholder-thumbnail.png",
  );

  // Premium document chưa redeem => cần redeem trước khi xem
  const isPremiumLocked = doc.isPremium && !hasRedeemed;
  const points = doc.points ?? 0;

  const openRedeemModal = () => setIsRedeemModalOpen(true);
  const closeRedeemModal = () => {
    if (!redeemLoading) setIsRedeemModalOpen(false);
  };

  const handleRedeem = async () => {
    if (!doc || hasRedeemed) return;

    try {
      setRedeemLoading(true);
      const res = await redeemDoc(String(doc.id));

      if (!res.success || !res.redeemed) {
        throw new Error("Redeem failed");
      }

      setHasRedeemed(true);
      setIsRedeemModalOpen(false);
      showToast({
        type: "success",
        title: "Redeem Successful",
        message: "Document unlocked! Redirecting...",
        duration: 2000,
      });

      // Đóng modal và redirect đến trang view detail
      close();
      router.push(`/docs-view/${doc.id}`);
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Redeem Failed",
        message: e?.message || "Failed to redeem document",
        duration: 5000,
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <>
      <div className={styles.backdrop} role="dialog" aria-modal="true">
        <div className={styles.modal}>
          <div className={styles.header}>
            <div className={styles.thumbWrap}>
              {doc.isPremium && (
                <span className={styles.premiumBadge}>
                  <Crown className={styles.premiumIcon} />
                </span>
              )}
              <Image
                src={thumbnailUrl || "/placeholder-thumbnail.png"}
                alt={doc.title || "Document thumbnail"}
                fill
                sizes="160px"
                className={styles.thumb}
              />
            </div>

            <div className={styles.headerText}>
              <h2 className={styles.title}>{doc.title}</h2>
              <div className={styles.metaLine}>
                {doc.orgName} • {doc.specialization}
              </div>

              {doc.isPremium && typeof doc.points === "number" && (
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>
                    Premium • {doc.points} pts
                  </span>
                </div>
              )}

              <span className={styles.uploader}>Uploader: {doc.uploader}</span>
              <div className={styles.statRow}>
                <span className={styles.stat} aria-label="Views">
                  <Eye className={styles.statIcon} />
                  {doc.viewCount ?? 0}
                </span>
                <span className={styles.stat} aria-label="Upvotes">
                  <ThumbsUp className={styles.statIcon} />
                  {doc.upvote_counts}
                </span>
                <span className={styles.stat} aria-label="Downvotes">
                  <ThumbsDown className={styles.statIcon} />
                  {doc.downvote_counts}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.body}>
            {doc.description && (
              <div className={styles.block}>
                <div className={styles.blockTitle}>Description</div>
                <p className={styles.paragraph}>{doc.description}</p>
              </div>
            )}

            <div className={styles.block}>
              <div className={styles.blockTitleRow}>
                <div className={styles.blockTitle}>Summary</div>

                <div
                  className={styles.levelGroup}
                  role="group"
                  aria-label="Summary level"
                >
                  {(["short", "medium", "detailed"] as Level[]).map((lv) => (
                    <label key={lv} className={styles.levelItem}>
                      <input
                        type="checkbox"
                        className={styles.levelCheck}
                        checked={level === lv}
                        onChange={() => setLevel(lv)}
                        aria-checked={level === lv}
                      />
                      <span className={styles.levelLabel}>
                        {lv === "short"
                          ? "Short"
                          : lv === "medium"
                            ? "Medium"
                            : "Detailed"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {summaryForLevel ? (
                <p className={styles.paragraph}>{summaryForLevel}</p>
              ) : (
                <p className={styles.paragraphMuted}>No summary available.</p>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.docId}>Public year: {doc.publicYear}</div>
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={close}>
                Close
              </button>
              {userInfoLoading ? (
                <button type="button" className={styles.btnPrimary} disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </button>
              ) : isPremiumLocked ? (
                <button
                  type="button"
                  className={styles.btnRedeem}
                  onClick={openRedeemModal}
                >
                  Redeem
                </button>
              ) : (
                <Link
                  href={`/docs-view/${doc.id}`}
                  className={styles.btnPrimary}
                  onClick={close}
                >
                  View details
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Redeem */}
      <ConfirmModal
        open={!!isPremiumLocked && isRedeemModalOpen}
        title="Redeem document"
        content={`You will spend ${points} points to unlock this document.`}
        subContent="After payment, this document will appear in your library and you won't need to purchase it again."
        confirmLabel="Redeem"
        cancelLabel="Cancel"
        loading={redeemLoading}
        onConfirm={handleRedeem}
        onCancel={closeRedeemModal}
      />
    </>
  );
}
