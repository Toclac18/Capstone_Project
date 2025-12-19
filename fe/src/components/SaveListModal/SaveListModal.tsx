// src/components/SaveListModal/SaveListModal.tsx
"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { toast, useToast } from "../ui/toast";
import { SaveList } from "@/types/saveList";
import {
  addDocToSaveList,
  createSaveListAndAddDoc,
  fetchSaveLists,
} from "@/services/save-list.service";
import { useReader } from "@/hooks/useReader";

type SaveListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
};

export default function SaveListModal({
  isOpen,
  onClose,
  docId,
}: SaveListModalProps) {
  const { showToast } = useToast();

  const { readerId } = useReader();

  const [saveLists, setSaveLists] = useState<SaveList[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load danh sách khi mở modal
  useEffect(() => {
    if (!isOpen || !readerId) return;

    setError(null);
    setLoadingList(true);
    setSelectedId(null);

    fetchSaveLists(readerId)
      .then((lists) => {
        setSaveLists(lists);
        if (lists.length > 0) {
          setSelectedId(lists[0].id);
        }
      })
      .catch(() => {
        setError("Cannot load save lists. Please try again later.");
      })
      .finally(() => setLoadingList(false));
  }, [isOpen, readerId]);

  const handleClose = () => {
    if (submitting) return;
    setMode("existing");
    setNewName("");
    setSelectedId(null);
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);

    if (!readerId) {
      setError("User not authenticated.");
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "existing") {
        if (!selectedId) {
          setError("Please select a Save List.");
          setSubmitting(false);
          return;
        }

        await addDocToSaveList(selectedId, docId, readerId);
      } else {
        const trimmed = newName.trim();
        if (!trimmed) {
          setError("Vui lòng nhập tên Save List.");
          setSubmitting(false);
          return;
        }

        await createSaveListAndAddDoc(readerId, trimmed, docId);
      }

      showToast(toast.success("Document Saved"));

      handleClose();
    } catch (e) {
      console.error(e);
      setError("Cannot save document. Please try again later.");

      showToast(
        toast.error("Failed to save document. Please try again later."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.title}>Save to list</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          <p className={styles.muted}>
            Please choose an existing Save List or create a new one to save this
            document.
          </p>

          {/* TABS SWITCHER */}
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={
                mode === "existing" ? styles.modeBtnActive : styles.modeBtn
              }
              onClick={() => setMode("existing")}
            >
              Choose Save List
            </button>
            <button
              type="button"
              className={mode === "new" ? styles.modeBtnActive : styles.modeBtn}
              onClick={() => setMode("new")}
            >
              Create New Save List
            </button>
          </div>

          {/* CASE 1: EXISTING LIST */}
          {mode === "existing" && (
            <div className={styles.block}>
              {loadingList ? (
                // Loading State: Skeleton hoặc text đơn giản
                <div className={`${styles.muted} ${styles.helper}`}>
                  Loading your lists...
                </div>
              ) : saveLists.length === 0 ? (
                // Empty State
                <div
                  className={styles.muted}
                  style={{ textAlign: "center", padding: "1rem 0" }}
                >
                  You have no Save Lists yet. <br />
                  <span
                    style={{
                      color: "#0ea5e9",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                    onClick={() => setMode("new")}
                  >
                    Create one now?
                  </span>
                </div>
              ) : (
                // List Items
                <ul className={styles.list}>
                  {saveLists.map((list) => {
                    const isSelected = selectedId === list.id;
                    return (
                      <li
                        key={list.id}
                        // Logic style: Nếu đang chọn thì dùng class .itemActive, ngược lại dùng .item
                        className={isSelected ? styles.itemActive : styles.item}
                        onClick={() => setSelectedId(list.id)}
                      >
                        <input
                          type="radio"
                          name="saveList"
                          value={list.id}
                          checked={isSelected}
                          onChange={() => setSelectedId(list.id)}
                          style={{ display: "none" }}
                        />

                        <div className={styles.radioVisual} />

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={styles.folderIcon}
                        >
                          <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
                        </svg>

                        {/* Content */}
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{list.name}</span>
                          <span className={styles.itemMeta}>
                            {list.docCount != null && (
                              <>
                                {list.docCount}{" "}
                                {list.docCount > 1 ? "documents" : "document"}
                              </>
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {mode === "new" && (
            <div className={styles.block}>
              <label className={styles.label} htmlFor="new-save-list-name">
                List Name
              </label>
              <input
                id="new-save-list-name"
                className={styles.input}
                placeholder="e.g., Thesis References, Holiday Reading..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={submitting}
                autoFocus
              />
              <div className={styles.helper}>
                Give your list a descriptive name.
              </div>
            </div>
          )}

          {error && <div className={styles.error}>⚠️ {error}</div>}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleSave}
            disabled={
              submitting ||
              (mode === "existing" && !selectedId) ||
              (mode === "new" && !newName.trim())
            }
          >
            {submitting ? "Saving..." : "Save"}{" "}
          </button>
        </div>
      </div>
    </div>
  );
}
