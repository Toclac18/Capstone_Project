"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchOrganizationDetail, type OrganizationDetail } from "../api";
import LeaveConfirmModal from "./_components/LeaveConfirmModal";
import { Users, FileText, Mail, Phone, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import styles from "../styles.module.css";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(() => {
    return !!id;
  });
  const [error, setError] = useState<string | null>(() => {
    return id ? null : "Organization ID is required";
  });
  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [logoError, setLogoError] = useState(false);

  const LOGO_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/org-logos/";

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const d = await fetchOrganizationDetail(id);
        if (!cancelled) {
          setDetail(d);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load organization detail");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleLeaveSuccess = () => {
    router.push("/reader/organizations");
  };

  const logoUrl = detail?.logo && !logoError 
    ? sanitizeImageUrl(detail.logo, LOGO_BASE_URL, null)
    : null;

  return (
    <main className={styles["page-container"]}>
      <div className={styles["page-header-detail"]}>
        <h2 className={styles["page-title"]}>Organization Detail</h2>
        <button
          onClick={() => router.back()}
          className={styles["btn-back-header"]}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {loading && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}

      {error && (
        <div className={styles["error-container"]}>
          {error}
        </div>
      )}

      {detail && (
        <div className={styles["detail-container"]}>
          {/* Header Card with Logo */}
          <div className={styles["detail-header-card"]}>
            <div className={styles["detail-header-content"]}>
              <div className={styles["detail-logo-section"]}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${detail.name} logo`}
                    className={styles["detail-logo"]}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className={styles["detail-logo-fallback"]}>
                    <span className={styles["detail-logo-fallback-text"]}>
                      {detail.name?.charAt(0)?.toUpperCase() || "O"}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles["detail-header-info"]}>
                <h1 className={styles["detail-org-name"]}>
                  {detail.name || "Organization"}
                </h1>
                <div className={styles["detail-org-meta"]}>
                  <span className={styles["detail-org-type"]}>
                    {detail.type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || ""}
                  </span>
                  {typeof detail.memberCount === "number" && typeof detail.documentCount === "number" && (
                    <>
                      <span className={styles["detail-meta-separator"]}>•</span>
                      <span className={styles["detail-meta-count"]}>
                        <Users className="inline h-4 w-4 mr-1" />
                        {detail.memberCount} Members
                      </span>
                      <span className={styles["detail-meta-separator"]}>•</span>
                      <span className={styles["detail-meta-count"]}>
                        <FileText className="inline h-4 w-4 mr-1" />
                        {detail.documentCount} Documents
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Information Card */}
          <div className={styles["detail-info-card"]}>
            <h2 className={styles["detail-section-title"]}>
              Organization Information
            </h2>
            <div className={styles["detail-info-grid"]}>
              <div className={styles["detail-info-item"]}>
                <div className={styles["detail-info-icon-wrapper"]}>
                  <Mail className={styles["detail-info-icon"]} />
                </div>
                <div className={styles["detail-info-content"]}>
                  <div className={styles["detail-info-label"]}>Email</div>
                  <div className={styles["detail-info-value"]}>
                    {detail.email || "N/A"}
                  </div>
                </div>
              </div>

              <div className={styles["detail-info-item"]}>
                <div className={styles["detail-info-icon-wrapper"]}>
                  <Phone className={styles["detail-info-icon"]} />
                </div>
                <div className={styles["detail-info-content"]}>
                  <div className={styles["detail-info-label"]}>Hotline</div>
                  <div className={styles["detail-info-value"]}>
                    {detail.hotline || "N/A"}
                  </div>
                </div>
              </div>

              <div className={styles["detail-info-item"]}>
                <div className={styles["detail-info-icon-wrapper"]}>
                  <MapPin className={styles["detail-info-icon"]} />
                </div>
                <div className={styles["detail-info-content"]}>
                  <div className={styles["detail-info-label"]}>Address</div>
                  <div className={styles["detail-info-value"]}>
                    {detail.address || "N/A"}
                  </div>
                </div>
              </div>

              <div className={styles["detail-info-item"]}>
                <div className={styles["detail-info-icon-wrapper"]}>
                  <Calendar className={styles["detail-info-icon"]} />
                </div>
                <div className={styles["detail-info-content"]}>
                  <div className={styles["detail-info-label"]}>Join Date</div>
                  <div className={styles["detail-info-value"]}>
                    {new Date(detail.joinDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles["detail-actions-card"]}>
            <div className={styles["detail-actions-content"]}>
              <div className={styles["detail-actions-info"]}>
                <h3 className={styles["detail-actions-title"]}>
                  Organization Actions
                </h3>
                <p className={styles["detail-actions-description"]}>
                  You can leave this organization at any time. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className={styles["btn-leave-org"]}
              >
                Leave Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <LeaveConfirmModal
          orgId={detail.id}
          orgName={detail.name}
          open={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onSuccess={handleLeaveSuccess}
        />
      )}
    </main>
  );
}

