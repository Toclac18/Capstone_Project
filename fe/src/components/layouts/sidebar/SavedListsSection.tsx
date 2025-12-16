"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/utils";
import { ChevronUp } from "@/components/icons";
import {
  getSavedLists,
  createSavedList,
  updateSavedList,
  deleteSavedList,
  type SavedList,
} from "@/services/saved-lists.service";
import { BookmarkIcon, PlusIcon, FolderIcon } from "./icons";
import { useToast } from "@/components/ui/toast";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface SavedListsSectionProps {
  isAuthenticated: boolean;
  role?: string | null;
}

export function SavedListsSection({ isAuthenticated, role }: SavedListsSectionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const showToast = toast?.showToast;
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only show for READER
  const shouldShow = isAuthenticated && (role === "READER");

  // Fetch saved lists once on mount (login/page load)
  useEffect(() => {
    if (!shouldShow) return;

    const loadSavedLists = async () => {
      setLoading(true);
      try {
        const result = await getSavedLists();
        // Handle both array response and wrapped response { data: [...] }
        const lists = Array.isArray(result) ? result : (result as any)?.data ?? [];
        setSavedLists(lists);
      } catch (error) {
        console.error("Failed to load saved lists:", error);
        setSavedLists([]);
      } finally {
        setLoading(false);
      }
    };

    loadSavedLists();
  }, [shouldShow]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reloadLists = async () => {
    try {
      const result = await getSavedLists();
      const lists = Array.isArray(result) ? result : (result as any)?.data ?? [];
      setSavedLists(lists);
    } catch (error) {
      console.error("Failed to reload saved lists:", error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || creating) return;

    setCreating(true);
    try {
      const newList = await createSavedList(newListName.trim());
      setSavedLists((prev) => [...prev, newList]);
      setNewListName("");
      setShowCreateInput(false);
      showToast?.({
        type: "success",
        title: "Success",
        message: `New saved list created successfully`,
        duration: 3000,
      });
      // Reload to get fresh data from server
      reloadLists();
    } catch (error) {
      console.error("Failed to create saved list:", error);
      showToast?.({
        type: "error",
        title: "Error",
        message: "Failed to create saved list. Please try again.",
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateList();
    } else if (e.key === "Escape") {
      setShowCreateInput(false);
      setNewListName("");
    }
  };

  const handleRename = async (listId: string) => {
    if (!editName.trim()) return;
    try {
      await updateSavedList(listId, editName.trim());
      showToast?.({ type: "success", title: "Success", message: "List renamed successfully", duration: 3000 });
      setEditingId(null);
      setEditName("");
      reloadLists();
    } catch (error) {
      console.error("Failed to rename list:", error);
      showToast?.({ type: "error", title: "Error", message: "Failed to rename list", duration: 5000 });
    }
  };

  const handleDeleteClick = (listId: string, listName: string) => {
    setDeleteTarget({ id: listId, name: listName });
    setMenuOpenId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteSavedList(deleteTarget.id);
      showToast?.({ type: "success", title: "Success", message: "List deleted successfully", duration: 3000 });
      setDeleteTarget(null);
      reloadLists();
    } catch (error) {
      console.error("Failed to delete list:", error);
      showToast?.({ type: "error", title: "Error", message: "Failed to delete list", duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, listId: string) => {
    if (e.key === "Enter") {
      handleRename(listId);
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditName("");
    }
  };

  if (!shouldShow) return null;

  return (
    <>
      <nav>
        <ul className="space-y-2">
          {/* Expandable header */}
          <li>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-dark-4 transition-colors",
                "hover:bg-gray-100 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white",
                isExpanded && "bg-gray-100 text-dark dark:bg-dark-3 dark:text-white"
              )}
            >
              <BookmarkIcon className="size-6 shrink-0" />
              <span className="flex-1 text-left">Saved Lists</span>
              <span className="mr-2 text-xs text-gray-500 dark:text-gray-400">
                {savedLists.length}
              </span>
              <ChevronUp
                className={cn(
                  "size-5 transition-transform duration-200",
                  isExpanded ? "rotate-0" : "rotate-180"
                )}
              />
            </button>
          </li>

          {/* Expanded content */}
          {isExpanded && (
            <li>
              <div className="ml-9 space-y-1.5 pb-2 pt-1">
                {loading && (
                  <div key="loading" className="py-2 text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                )}
                {!loading && savedLists.length === 0 && (
                  <div key="empty" className="py-2 text-sm text-gray-500 dark:text-gray-400">
                    No saved lists yet
                  </div>
                )}
                {!loading &&
                  savedLists.map((list) => (
                    <div key={list.id} className="relative flex items-center">
                      {editingId === list.id ? (
                        <div className="flex w-full items-center gap-2 px-3 py-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, list.id)}
                            autoFocus
                            className={cn(
                              "flex-1 rounded border border-gray-300 px-2 py-1 text-sm",
                              "focus:border-primary focus:outline-none",
                              "dark:border-gray-600 dark:bg-dark-2 dark:text-white"
                            )}
                          />
                          <button
                            onClick={() => handleRename(list.id)}
                            className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/reader/saved-list/${list.id}`)}
                            className={cn(
                              "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                              "text-dark-4 hover:bg-gray-100 hover:text-dark",
                              "dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white",
                              pathname === `/reader/saved-list/${list.id}` && "bg-gray-100 dark:bg-dark-3"
                            )}
                          >
                            <FolderIcon className="size-4 shrink-0 text-gray-400" />
                            <span className="flex-1 truncate text-left">{list.name}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === list.id ? null : list.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                          {menuOpenId === list.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-dark-2"
                            >
                              <button
                                onClick={() => {
                                  setEditingId(list.id);
                                  setEditName(list.name);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-3"
                              >
                                <Pencil className="size-4" />
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteClick(list.id, list.name)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-3"
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                {/* Create new list */}
                {showCreateInput ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="List name..."
                      autoFocus
                      disabled={creating}
                      className={cn(
                        "flex-1 rounded border border-gray-300 px-2 py-1 text-sm",
                        "focus:border-primary focus:outline-none",
                        "dark:border-gray-600 dark:bg-dark-2 dark:text-white"
                      )}
                    />
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim() || creating}
                      className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {creating ? "..." : "Add"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateInput(true)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm transition-colors",
                      "text-gray-500 hover:border-primary hover:text-primary",
                      "dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary dark:hover:text-primary"
                    )}
                  >
                    <PlusIcon className="size-4" />
                    <span>Create a Saved List</span>
                  </button>
                )}
              </div>
            </li>
          )}
        </ul>
      </nav>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-dark-2">
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Delete Saved List
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{deleteTarget.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
