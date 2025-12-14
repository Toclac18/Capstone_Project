"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOrganizations, type OrganizationSummary } from "./api";
import { Pagination } from "@/components/ui/pagination";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { Building2, Calendar, Tag, ArrowRight, Users } from "lucide-react";
import styles from "./styles.module.css";

type LoadState = "loading" | "success" | "empty" | "error";

const ITEMS_PER_PAGE = 4;
const LOGO_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/org-logos/";

export default function Page() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const run = async () => {
      setState("loading");
      try {
        const res = await fetchOrganizations();
        setItems(res.items);
        setState(res.items.length ? "success" : "empty");
        setCurrentPage(1); // Reset to first page when data changes
        setLogoErrors(new Set()); // Reset logo errors when data changes
      } catch (e: any) {
        setError(e?.message || "Unable to load organization list. Please try again later.");
        setState("error");
      }
    };
    run();
  }, []);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const displayedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items
      .slice(startIndex, endIndex)
      .map((org) => ({
        id: org.id,
        name: org.name,
        type: org.type,
        joinDate: org.joinDate,
        logo: org.logo,
        logoUrl: sanitizeImageUrl(org.logo, LOGO_BASE_URL, null),
      }));
  }, [items, currentPage]);

  const handleLogoError = (orgId: string) => {
    setLogoErrors((prev) => new Set(prev).add(orgId));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCardClick = (orgId: string) => {
    router.push(`/reader/organizations/${orgId}`);
  };

  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName="My Organizations" />
      <div className={styles["page-header"]}>
        {state === "success" && items.length > 0 && (
          <div className={styles["header-info"]}>
            <Users className={styles["header-icon"]} />
            <span className={styles["header-count"]}>
              {items.length} {items.length === 1 ? "Organization" : "Organizations"}
            </span>
          </div>
        )}
      </div>

      {state === "loading" && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-grid"]}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles["loading-card"]}>
                <div className={styles["loading-skeleton-logo"]} />
                <div className={styles["loading-skeleton-text"]} />
                <div className={styles["loading-skeleton-text-small"]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>
          <div className={styles["error-content"]}>
            <Building2 className={styles["error-icon"]} />
            <p className={styles["error-message"]}>{error}</p>
          </div>
        </div>
      )}

      {state === "empty" && (
        <div className={styles["empty-container"]}>
          <div className={styles["empty-content"]}>
            <div className={styles["empty-icon-wrapper"]}>
              <Building2 className={styles["empty-icon"]} />
            </div>
            <h3 className={styles["empty-title"]}>
              You are not in any organizations
            </h3>
            <p className={styles["empty-description"]}>
              Join an organization to get started and access shared resources.
            </p>
          </div>
        </div>
      )}

      {state === "success" && (
        <>
          <div className={styles["organizations-grid"]}>
            {displayedItems.map((org) => {
              const hasLogoError = logoErrors.has(org.id);
              const showLogo = org.logoUrl && !hasLogoError;
              
              return (
                <div
                  key={org.id}
                  className={`${styles["org-card"]} group`}
                  onClick={() => handleCardClick(org.id)}
                >
                  <div className={styles["org-card-header"]}>
                    <div className={styles["org-logo-wrapper"]}>
                      {showLogo && org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={`${org.name} logo`}
                          className={styles["org-logo"]}
                          onError={() => handleLogoError(org.id)}
                        />
                      ) : (
                        <div className={styles["org-logo-fallback"]}>
                          <span className={styles["org-logo-fallback-text"]}>
                            {org.name?.charAt(0)?.toUpperCase() || "O"}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className={styles["btn-view-card"]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(org.id);
                      }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className={styles["org-card-body"]}>
                    <h3 className={styles["org-card-name"]}>
                      {org.name || "Unknown Organization"}
                    </h3>
                    
                    <div className={styles["org-card-info"]}>
                      {org.type && (
                        <div className={styles["org-info-item"]}>
                          <Tag className={styles["info-icon"]} />
                          <span className={styles["info-text"]}>{org.type}</span>
                        </div>
                      )}
                      
                      {org.joinDate && (
                        <div className={styles["org-info-item"]}>
                          <Calendar className={styles["info-icon"]} />
                          <span className={styles["info-text"]}>
                            Joined {new Date(org.joinDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {items.length > ITEMS_PER_PAGE && (
            <div className={styles["pagination-wrapper"]}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={items.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                loading={false}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}


