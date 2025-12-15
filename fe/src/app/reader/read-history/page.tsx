"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchReadHistory, type ReadHistoryItem } from "./api";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import styles from "./styles.module.css";
import {
  AlertCircle,
  BookOpen,
  Eye,
  Crown,
  Clock,
} from "lucide-react";

type LoadState = "loading" | "success" | "empty" | "error";

const ITEMS_PER_PAGE = 10;
const THUMBNAIL_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/thumb/";
const DEFAULT_THUMBNAIL = "/images/document.jpg";

export default function ReadHistoryPage() {
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<ReadHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadData = useCallback(
    async (page: number) => {
      setState("loading");
      setError(null);
      try {
        const result = await fetchReadHistory({
          page: page - 1,
          size: ITEMS_PER_PAGE,
        });
        setItems(result.data);
        setTotalItems(result.pageInfo.totalElements);
        setTotalPages(result.pageInfo.totalPages);
        setCurrentPage(page);
        setState(result.data.length ? "success" : "empty");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load read history";
        setError(msg);
        setState("error");
        showToast({ type: "error", title: "Error", message: msg });
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handlePageChange = (page: number) => {
    loadData(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatReadTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLoading = state === "loading";

  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName="Read History" />

      {isLoading && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]} />
          <p className={styles["loading-text"]}>Loading history...</p>
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>
          <AlertCircle className={styles["error-icon"]} />
          <p>{error || "Failed to load read history"}</p>
        </div>
      )}

      {state === "empty" && (
        <div className={styles["empty-container"]}>
          <BookOpen className={styles["empty-icon"]} />
          <h3 className={styles["empty-title"]}>No reading history</h3>
          <p className={styles["empty-text"]}>
            Documents you read will appear here
          </p>
        </div>
      )}

      {state === "success" && (
        <div className={styles["content-container"]}>
          {/* Timeline */}
          <div className={styles["timeline"]}>
            {items.map((item, index) => {
              const doc = item.document;
              const thumbnailUrl = sanitizeImageUrl(
                doc.thumbnailUrl,
                THUMBNAIL_BASE_URL,
                DEFAULT_THUMBNAIL
              );

              return (
                <div key={item.id} className={styles["timeline-item"]}>
                  {/* Timeline dot */}
                  <div className={styles["timeline-dot"]}>
                    <BookOpen className="h-3 w-3" />
                  </div>
                  
                  {/* Timeline line */}
                  {index < items.length - 1 && <div className={styles["timeline-line"]} />}

                  {/* Content */}
                  <div className={styles["timeline-content"]}>
                    <div className={styles["time-label"]}>
                      <Clock className="h-3 w-3" />
                      {formatReadTime(item.readAt)}
                    </div>
                    
                    <Link href={`/docs-view/${doc.id}`} className={styles["doc-card"]}>
                      <div className={styles["doc-thumbnail"]}>
                        <img
                          src={thumbnailUrl || DEFAULT_THUMBNAIL}
                          alt={doc.title}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== DEFAULT_THUMBNAIL) {
                              target.src = DEFAULT_THUMBNAIL;
                            }
                          }}
                        />
                        {doc.isPremium && (
                          <span className={styles["premium-tag"]}>
                            <Crown className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      
                      <div className={styles["doc-info"]}>
                        <h4 className={styles["doc-title"]}>{doc.title}</h4>
                        <p className={styles["doc-meta"]}>
                          {doc.docTypeName} • {doc.domainName}
                        </p>
                        <p className={styles["doc-uploader"]}>
                          by {doc.uploader?.fullName || "Unknown"}
                        </p>
                      </div>
                      
                      <div className={styles["doc-action"]}>
                        <Eye className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              loading={isLoading}
            />
          )}
        </div>
      )}
    </main>
  );
}
