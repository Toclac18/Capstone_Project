"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { getSavedListDetail, deleteSavedList, removeDocumentFromSavedList, type SavedListDetail } from "@/services/saved-lists.service";
import { useToast } from "@/components/ui/toast";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { AlertCircle, FileText, Trash2, Eye, FolderOpen, BookmarkMinus } from "lucide-react";
import styles from "../../library/styles.module.css";

const THUMBNAIL_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/doc-thumbs/";
const DEFAULT_THUMBNAIL = "/images/document.jpg";

type LoadState = "loading" | "success" | "empty" | "error";

export default function SavedListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [savedList, setSavedList] = useState<SavedListDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [unsaveTarget, setUnsaveTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteListModal, setDeleteListModal] = useState(false);

  const fetchData = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const result = await getSavedListDetail(id);
      setSavedList(result);
      setState(result.documents?.length ? "success" : "empty");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unable to load saved list.";
      setError(msg);
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleUnsaveConfirm = async () => {
    if (!unsaveTarget || deletingDocId) return;
    setDeletingDocId(unsaveTarget.id);
    try {
      await removeDocumentFromSavedList(id, unsaveTarget.id);
      showToast({ type: "success", title: "Success", message: "Document removed from list", duration: 3000 });
      setUnsaveTarget(null);
      fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to remove document";
      showToast({ type: "error", title: "Error", message: msg, duration: 5000 });
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleDeleteListConfirm = async () => {
    try {
      await deleteSavedList(id);
      showToast({ type: "success", title: "Success", message: "Saved list deleted", duration: 3000 });
      router.push("/reader/library");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete list";
      showToast({ type: "error", title: "Error", message: msg, duration: 5000 });
    }
  };

  const isLoading = state === "loading";

  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName={"Folder: " + savedList?.name || "Saved List"} />

      {isLoading && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>
          <AlertCircle className={styles["error-icon"]} />
          <p>{error || "Unable to load saved list."}</p>
        </div>
      )}

      {state === "empty" && (
        <div className={styles["empty-container"]}>
          <FileText className={styles["empty-icon"]} />
          <p className={styles["empty-text"]}>This saved list is empty.</p>
        </div>
      )}

      {state === "success" && savedList && (
        <div className="space-y-4">
          {savedList.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-dark-2"
            >
              {/* Thumbnail */}
              <Link href={`/docs-view/${doc.id}`} className="shrink-0">
                <div className="relative h-28 w-20 overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-600">
                  <img
                    src={sanitizeImageUrl(doc.thumbnailUrl, THUMBNAIL_BASE_URL, DEFAULT_THUMBNAIL) || DEFAULT_THUMBNAIL}
                    alt={doc.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== DEFAULT_THUMBNAIL) target.src = DEFAULT_THUMBNAIL;
                    }}
                  />
                </div>
              </Link>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/docs-view/${doc.id}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {doc.title}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {doc.docTypeName && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-dark-3">
                      {doc.docTypeName}
                    </span>
                  )}
                  {doc.domainName && (
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="size-4" />
                      {doc.domainName}
                    </span>
                  )}
                  {doc.viewCount !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <Eye className="size-4" />
                      {doc.viewCount} views
                    </span>
                  )}
                </div>
              </div>

              {/* Unsave button */}
              <button
                onClick={() => setUnsaveTarget({ id: doc.id, title: doc.title })}
                className="shrink-0 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Remove from saved list"
                disabled={deletingDocId === doc.id}
              >
                <BookmarkMinus className="size-5" />
                <span className="hidden sm:inline">{deletingDocId === doc.id ? "Removing..." : "Unsave"}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unsave Confirmation Modal */}
      {unsaveTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-dark-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <BookmarkMinus className="size-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Remove from Saved List
              </h3>
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to remove &quot;{unsaveTarget.title}&quot; from this saved list?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUnsaveTarget(null)}
                disabled={!!deletingDocId}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-3"
              >
                Cancel
              </button>
              <button
                onClick={handleUnsaveConfirm}
                disabled={!!deletingDocId}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {deletingDocId ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete List Confirmation Modal */}
      {deleteListModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-dark-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="size-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Delete Saved List
              </h3>
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{savedList?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteListModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteListConfirm}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
