"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import { useModalPreview } from "./Provider";

type Level = "short" | "medium" | "detailed";

export default function ModalPreview() {
  const { isOpen, doc, close } = useModalPreview();
  const [level, setLevel] = useState<Level>("short");

  useEffect(() => {
    if (isOpen) {
      setLevel("short");
    }
  }, [isOpen]);

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

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.thumbWrap}>
            <Image
              src={doc.thumbnail || "/placeholder-thumbnail.png"}
              alt={doc.title || "Document thumbnail"}
              fill
              sizes="160px"
              className={styles.thumb}
            />
          </div>

          <div className={styles.headerText}>
            <h2 className={styles.title}>{doc.title}</h2>
            <div className={styles.metaLine}>
              {doc.orgName} • {doc.specialization} • {doc.viewCount ?? 0} views
            </div>

            {doc.isPremium && typeof doc.points === "number" && (
              <div className={styles.badgeRow}>
                <span className={styles.badge}>Premium • {doc.points} pts</span>
              </div>
            )}

            <div className={styles.statRow}>
              <span className={styles.stat} aria-label="Upvotes">
                ▲ {doc.upvote_counts}
              </span>
              <span className={styles.stat} aria-label="Downvotes">
                ▼ {doc.downvote_counts}
              </span>
              <span className={styles.uploader}>Uploader: {doc.uploader}</span>
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
            <Link href={`/docs-view/${doc.id}`} className={styles.btnPrimary}>
              View details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
