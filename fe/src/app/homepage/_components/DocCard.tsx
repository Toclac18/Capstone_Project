"use client";

import Image from "next/image";
import styles from "../styles.module.css";

type Props = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  upvote_counts: number;
  downvote_counts: number;
  specialization: string;
  uploader: string;
  thumbnail: string;
  orgName: string;
  viewCount: number;
  isPremium: boolean;
  points?: string; // present only if isPremium === true
};

export default function DocCard(props: Props) {
  const score = props.upvote_counts - props.downvote_counts;

  return (
    <div className={styles.card}>
      <div className={styles.thumb}>
        <Image
          src={props.thumbnail}
          alt={props.title}
          fill
          sizes="(max-width: 768px) 80vw, 260px"
          className={styles.thumbImg}
          priority={false}
        />
      </div>

      <div className={styles.cardTitle}>{props.title}</div>

      {/* Meta: subject • pages • views • org */}
      <div className={styles.meta}>
        {/* <span>{props.subject ?? "—"}</span> */}
        {props.pageCount && <span> • {props.pageCount} pages</span>}
        <span> • {props.viewCount.toLocaleString()} views</span>
        <span> • {props.orgName}</span>
      </div>

      <div className={styles.votesRow}>
        <span className={styles.voteUp}>▲ {props.upvote_counts}</span>
        <span className={styles.voteDown}>▼ {props.downvote_counts}</span>
        <span className={styles.specChip}>{props.specialization}</span>
      </div>

      <div className={styles.uploader}>Uploaded by {props.uploader}</div>

      {/* Premium badge (only when premium) — reuses existing chip class */}
      {props.isPremium && (
        <div className={styles.meta}>
          <span className={styles.specChip}>
            Premium{props.points ? ` • ${props.points} pts` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
