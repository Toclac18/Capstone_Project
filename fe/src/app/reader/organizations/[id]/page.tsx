"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchOrganizationDetail, type OrganizationDetail } from "../api";
import LeaveConfirmModal from "./_components/LeaveConfirmModal";
import styles from "../styles.module.css";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError("Organization ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchOrganizationDetail(id)
      .then((d) => {
        setDetail(d);
      })
      .catch((e: any) => {
        setError(e?.message || "Failed to load organization detail");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleLeaveSuccess = () => {
    router.push("/reader/organizations");
  };

  return (
    <main className={styles["page-container"]}>
      <h2 className={styles["page-title"]}>Organization Detail</h2>

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
        <div className={styles["cards-container"]}>
          {/* Header Card */}
          <div className={styles["header-card"]}>
            <div className={styles["header-content"]}>
              <div className={styles["header-main"]}>
                {detail.logo ? (
                  <img
                    src={detail.logo}
                    alt={`${detail.name} logo`}
                    className={styles["org-logo"]}
                  />
                ) : (
                  <div className={styles["org-logo-fallback"]}>
                    <span className={styles["org-logo-fallback-text"]}>
                      {detail.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className={styles["org-name"]}>
                    {detail.name}
                  </h2>
                  <p className={styles["org-type"]}>
                    {detail.type.replace("-", " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.back()}
                className={styles["btn-back"]}
              >
                Back
              </button>
            </div>
          </div>

          {/* Information Card */}
          <div className={styles["info-card"]}>
            <h3 className={styles["info-title"]}>
              Organization Information
            </h3>
            <div className={styles["info-grid"]}>
              <div className={styles["info-field"]}>
                <div className={styles["info-label"]}>
                  Email
                </div>
                <div className={styles["info-value"]}>
                  {detail.email}
                </div>
              </div>
              <div className={styles["info-field"]}>
                <div className={styles["info-label"]}>
                  Hotline
                </div>
                <div className={styles["info-value"]}>
                  {detail.hotline}
                </div>
              </div>
              <div className={styles["info-field-full"]}>
                <div className={styles["info-label"]}>
                  Address
                </div>
                <div className={styles["info-value"]}>
                  {detail.address}
                </div>
              </div>
              <div className={styles["info-field"]}>
                <div className={styles["info-label"]}>
                  Join Date
                </div>
                <div className={styles["info-value"]}>
                  {new Date(detail.joinDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles["actions-card"]}>
            <div className={styles["actions-content"]}>
              <div>
                <h3 className={styles["actions-info-title"]}>
                  Organization Actions
                </h3>
                <p className={styles["actions-info-text"]}>
                  You can leave this organization at any time
                </p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className={styles["btn-leave"]}
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

