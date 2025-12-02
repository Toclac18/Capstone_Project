// src/components/SaveListModal/SaveListModal.tsx
"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { toast, useToast } from "../ui/toast";
import {
  fetchSaveLists,
  addDocToSaveList,
  createSaveListAndAddDoc,
  type SaveListSummary,
} from "@/services/save-list.service";

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

  // Danh sách Save List của user hiện tại
  const [saveLists, setSaveLists] = useState<SaveListSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // existing = chọn list có sẵn, new = tạo list mới
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khi mở modal thì load danh sách Save List
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setLoadingList(true);
    setSelectedId(null);

    fetchSaveLists()
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
  }, [isOpen]);

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

    try {
      if (mode === "existing") {
        if (!selectedId) {
          setError("Please select a Save List.");
          setSubmitting(false);
          return;
        }

        // Thêm document vào list có sẵn
        await addDocToSaveList(selectedId, docId);
      } else {
        const trimmed = newName.trim();
        if (!trimmed) {
          setError("Vui lòng nhập tên Save List.");
          setSubmitting(false);
          return;
        }

        // Tạo list mới + add document luôn
        await createSaveListAndAddDoc(trimmed, docId);
      }

      showToast(toast.success("Document saved to your list."));
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
        <div className={styles.header}>
          <h2 className={styles.title}>Save documents to your list</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className={styles.muted}>
          Please choose an existing Save List or create a new one to save this
          document.
        </p>

        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={
              mode === "existing" ? styles.modeBtnActive : styles.modeBtn
            }
            onClick={() => setMode("existing")}
            disabled={submitting}
          >
            Choose Save List
          </button>
          <button
            type="button"
            className={mode === "new" ? styles.modeBtnActive : styles.modeBtn}
            onClick={() => setMode("new")}
            disabled={submitting}
          >
            Create New Save List
          </button>
        </div>

        {mode === "existing" && (
          <div className={styles.block}>
            {loadingList ? (
              <div className={styles.muted}>Loading Saved lists...</div>
            ) : saveLists.length === 0 ? (
              <div className={styles.muted}>
                You have no Save Lists. Please create a new one.
              </div>
            ) : (
              <ul className={styles.list}>
                {saveLists.map((list) => (
                  <li key={list.id} className={styles.listItem}>
                    <label className={styles.listLabel}>
                      <input
                        type="radio"
                        name="saveList"
                        value={list.id}
                        checked={selectedId === list.id}
                        onChange={() => setSelectedId(list.id)}
                        className={styles.radio}
                        disabled={submitting}
                      />
                      <span className={styles.name}>{list.name}</span>
                      {typeof list.docCount === "number" && (
                        <span className={styles.counter}>
                          {list.docCount} document
                          {list.docCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {mode === "new" && (
          <div className={styles.block}>
            <label className={styles.label} htmlFor="new-save-list-name">
              New Save List Name
            </label>
            <input
              id="new-save-list-name"
              className={styles.input}
              placeholder="Enter save list name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={submitting}
            />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

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
            disabled={submitting || (mode === "existing" && !selectedId)}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
