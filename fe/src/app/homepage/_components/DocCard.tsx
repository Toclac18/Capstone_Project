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
};

export default function DocCard(props: Props) {
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

      <div className={styles.meta}>
        <span>{props.subject ?? "—"}</span>
        {props.pageCount && <span>• {props.pageCount} pages</span>}
      </div>

      <div className={styles.votesRow}>
        <span className={styles.voteUp}>▲ {props.upvote_counts}</span>
        <span className={styles.voteDown}>▼ {props.downvote_counts}</span>
        <span className={styles.specChip}>{props.specialization}</span>
      </div>

      <div className={styles.uploader}>Uploaded by {props.uploader}</div>
    </div>
  );
}
