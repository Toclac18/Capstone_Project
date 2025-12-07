// src/app/docs-view/[id]/_components/CommentsSection.tsx
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useDocsView } from "../DocsViewProvider";
import { useReader } from "@/hooks/useReader";
import styles from "../styles.module.css";
import { Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { safeFormatDistance } from "@/utils/date";

// Custom Delete button wrapper để hiển thị icon + text
function DeleteButton({
  onDelete,
  itemId,
  itemName,
  title,
  description,
  className,
}: {
  onDelete: (id: string | number) => Promise<void>;
  itemId: string | number;
  itemName?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isLoading) return;
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      await onDelete(itemId);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={isLoading}
        className={className}
        title="Delete comment"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>

      {isModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className={styles.deleteModalOverlay} onClick={handleCloseModal}>
            <div
              className={styles.deleteModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Header */}
                <div className={styles.deleteModalHeader}>
                  <div className={styles.deleteModalHeaderContent}>
                    <div className={styles.deleteModalIconWrapper}>
                      <AlertTriangle
                        className={styles.deleteModalIcon}
                        size={20}
                      />
                    </div>
                    <div>
                      <h3 className={styles.deleteModalTitle}>
                        {title || "Delete comment"}
                      </h3>
                      {itemName && (
                        <p className={styles.deleteModalItemName}>{itemName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className={styles.deleteModalCloseBtn}
                    disabled={isLoading}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className={styles.deleteModalContent}>
                  <p className={styles.deleteModalDescription}>
                    {description ||
                      "Are you sure you want to delete this comment?"}
                  </p>

                  <div className={styles.deleteModalWarningBox}>
                    <div className={styles.deleteModalWarningContent}>
                      <AlertTriangle
                        className={styles.deleteModalWarningIcon}
                        size={20}
                      />
                      <div>
                        <p className={styles.deleteModalWarningTitle}>
                          This action cannot be undone
                        </p>
                        <p className={styles.deleteModalWarningText}>
                          The comment will be permanently deleted from the
                          system.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={styles.deleteModalFooter}>
                  <button
                    type="button"
                    className={styles.deleteModalCancel}
                    onClick={handleCloseModal}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.deleteModalConfirm}
                    onClick={handleConfirmDelete}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <svg
                        className={styles.deleteModalSpinner}
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    {isLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default function CommentsSection() {
  const {
    comments,
    commentLoading,
    addNewComment,
    editComment,
    deleteComment,
  } = useDocsView();
  const { readerId } = useReader();

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
        {comments.map((c, index) => {
          if (!c || !c.id) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("Invalid comment in comments list", { c, index });
            }
            return null;
          }

          const isEditing = editingId === c.id;
          const isOwner = readerId && c.userId && readerId === c.userId;

          return (
            <li key={c.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                {c.author.charAt(0).toUpperCase()}
              </div>

              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{c.author}</span>
                  <span className={styles.commentTime}>
                    {safeFormatDistance(c.createdAt)}
                  </span>

                  {/* ACTIONS: Edit + Delete (chỉ hiển thị cho owner) */}
                  {isOwner && (
                    <div className={styles.commentActions}>
                      {!isEditing && (
                        <>
                          <button
                            type="button"
                            className={styles.commentActionBtn}
                            onClick={() =>
                              handleStartEdit(c.id, c.content || "")
                            }
                            disabled={commentLoading}
                            title="Edit comment"
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </button>

                          {/* Delete với confirm modal */}
                          <DeleteButton
                            onDelete={handleDelete}
                            itemId={c.id}
                            itemName={
                              c.content?.substring(0, 50) +
                              (c.content && c.content.length > 50 ? "..." : "")
                            }
                            title="Delete comment"
                            description="Are you sure you want to delete this comment?"
                            className={styles.commentActionBtnDanger}
                          />
                        </>
                      )}
                    </div>
                  )}
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
