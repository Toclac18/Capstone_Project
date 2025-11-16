// src/app/docs-view/[id]/_components/CommentsSection.tsx
"use client";

import { useState } from "react";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export default function CommentsSection() {
  const { comments, commentLoading, addNewComment } = useDocsView();
  const [value, setValue] = useState("");

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    await addNewComment(text);
    setValue("");
  };

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <h2 className={styles.commentsTitle}>Comments</h2>
        <span className={styles.commentsCount}>{comments.length}</span>
      </div>

      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <textarea
          className={styles.commentInput}
          rows={3}
          placeholder="Write a comment about this document…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className={styles.commentFormFooter}>
          <button
            type="submit"
            className={styles.commentSubmit}
            disabled={!value.trim() || commentLoading}
          >
            {commentLoading ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>

      <ul className={styles.commentList}>
        {comments.map((c) => (
          <li key={c.id} className={styles.commentItem}>
            <div className={styles.commentAvatar}>
              {c.author.charAt(0).toUpperCase()}
            </div>
            <div className={styles.commentBody}>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{c.author}</span>
                <span className={styles.commentTime}>
                  {formatDistanceToNow(new Date(c.createdAt), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </span>
              </div>
              <p className={styles.commentContent}>{c.content}</p>
            </div>
          </li>
        ))}
        {!comments.length && (
          <li className={styles.commentEmpty}>
            No comments yet. Be the first to share your thoughts.
          </li>
        )}
      </ul>
    </section>
  );
}
