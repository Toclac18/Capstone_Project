// src/app/docs-view/[id]/_components/CommentsSection.tsx
"use client";

import { useState } from "react";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import DeleteConfirmation from "@/components/ui/delete-confirmation";

export default function CommentsSection() {
  const {
    comments,
    commentLoading,
    addNewComment,
    editComment,
    deleteComment,
  } = useDocsView();

  const [value, setValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // ----- ADD NEW COMMENT -----
  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    await addNewComment(text);
    setValue("");
  };

  // ----- EDIT COMMENT -----
  const handleStartEdit = (id: string, currentContent: string) => {
    setEditingId(id);
    setEditingValue(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleSaveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const text = editingValue.trim();
    if (!text) return;
    await editComment(id, text);
    setEditingId(null);
    setEditingValue("");
  };

  // ----- DELETE COMMENT (được gọi từ DeleteConfirmation) -----
  const handleDelete = async (id: string | number) => {
    // DeleteConfirmation truyền vào string | number → convert về string
    await deleteComment(String(id));
  };

  return (
    <section className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <h2 className={styles.commentsTitle}>Comments</h2>
        <span className={styles.commentsCount}>{comments.length}</span>
      </div>

      {/* Form add mới */}
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

      {/* List comments */}
      <ul className={styles.commentList}>
        {comments.map((c) => {
          const isEditing = editingId === c.id;

          return (
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

                  {/* ACTIONS: Edit + Delete (có confirm) */}
                  <div className={styles.commentActions}>
                    {!isEditing && (
                      <>
                        <button
                          type="button"
                          className={styles.commentActionBtn}
                          onClick={() => handleStartEdit(c.id, c.content || "")}
                          disabled={commentLoading}
                        >
                          Edit
                        </button>

                        {/* Delete với confirm modal */}
                        <DeleteConfirmation
                          onDelete={handleDelete}
                          itemId={c.id}
                          itemName={c.content}
                          title="Delete comment"
                          description="Are you sure you want to delete this comment?"
                          size="sm"
                          variant="text"
                          // nếu muốn chỉnh lại style inline text, có thể gắn thêm class module:
                          className={styles.commentActionBtnDanger}
                        />
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveEdit(e, c.id)}
                    className={styles.commentEditForm}
                  >
                    <textarea
                      className={styles.commentInput}
                      rows={2}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                    />
                    <div className={styles.commentFormFooter}>
                      <button
                        type="submit"
                        className={styles.commentSubmit}
                        disabled={!editingValue.trim() || commentLoading}
                      >
                        {commentLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className={styles.commentCancelBtn}
                        onClick={handleCancelEdit}
                        disabled={commentLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className={styles.commentContent}>{c.content}</p>
                )}
              </div>
            </li>
          );
        })}

        {!comments.length && (
          <li className={styles.commentEmpty}>
            No comments yet. Be the first to share your thoughts.
          </li>
        )}
      </ul>
    </section>
  );
}
