"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Building2, Check, X as XIcon, Loader2, Calendar } from "lucide-react";
import { getPendingInvitations, acceptInvitation, rejectInvitation, type OrgEnrollmentResponse } from "@/services/enrollments.service";
import { useToast } from "@/components/ui/toast";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import styles from "@/app/profile/styles.module.css";

const AVATAR_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/avatars/";

interface InvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationAccepted?: () => void;
  onInvitationRejected?: () => void;
}

export default function InvitationsModal({
  isOpen,
  onClose,
  onInvitationAccepted,
  onInvitationRejected,
}: InvitationsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<OrgEnrollmentResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadInvitations = useCallback(async (page: number = 0) => {
    try {
      setLoading(true);
      const response = await getPendingInvitations({ page, size: 10 });
      setInvitations(response.content);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error?.message || "Failed to load invitations",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen && mounted) {
      loadInvitations(0);
    }
  }, [isOpen, mounted, loadInvitations]);

  const handleAccept = async (enrollmentId: string) => {
    try {
      setAcceptingIds((prev) => new Set(prev).add(enrollmentId));
      await acceptInvitation(enrollmentId);
      
      showToast({
        type: "success",
        title: "Success",
        message: "Invitation accepted successfully",
      });

      // Remove accepted invitation from list
      setInvitations((prev) => prev.filter((inv) => inv.enrollmentId !== enrollmentId));
      
      // Reload to get updated list
      await loadInvitations(currentPage);
      
      // Notify parent component
      if (onInvitationAccepted) {
        onInvitationAccepted();
      }
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error?.message || "Failed to accept invitation",
      });
    } finally {
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReject = async (enrollmentId: string) => {
    try {
      setRejectingIds((prev) => new Set(prev).add(enrollmentId));
      await rejectInvitation(enrollmentId);
      
      showToast({
        type: "success",
        title: "Success",
        message: "Invitation rejected successfully",
      });

      // Remove rejected invitation from list
      setInvitations((prev) => prev.filter((inv) => inv.enrollmentId !== enrollmentId));
      
      // Reload to get updated list
      await loadInvitations(currentPage);
      
      // Notify parent component
      if (onInvitationRejected) {
        onInvitationRejected();
      }
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error?.message || "Failed to reject invitation",
      });
    } finally {
      setRejectingIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-backdrop"]} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-lg"]}`}>
        <div className={`${styles["modal-card"]} ${styles["modal-card-flex"]}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["purple"]}`}>
                <Building2 className={`${styles["modal-icon"]} ${styles["purple"]}`} />
              </div>
              <div>
                <h2 className={styles["modal-title"]}>Organization Invitations</h2>
                <p className={styles["modal-subtitle"]}>
                  Manage your pending organization invitations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-btn"]}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={`${styles["modal-form"]} ${styles["with-scroll"]}`} style={{ maxHeight: "70vh" }}>
            {loading ? (
              <div className={styles["invitations-loading"]}>
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className={styles["invitations-loading-text"]}>Loading invitations...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className={styles["invitations-empty"]}>
                <Building2 className={styles["invitations-empty-icon"]} />
                <p className={styles["invitations-empty-title"]}>No pending invitations</p>
                <p className={styles["invitations-empty-subtitle"]}>
                  You don&apos;t have any organization invitations at the moment
                </p>
              </div>
            ) : (
              <div className={styles["invitations-list"]}>
                {invitations.map((invitation) => {
                  const isAccepting = acceptingIds.has(invitation.enrollmentId);
                  const isRejecting = rejectingIds.has(invitation.enrollmentId);
                  const logoUrl = sanitizeImageUrl(
                    invitation.memberAvatarUrl,
                    AVATAR_BASE_URL,
                    null
                  );

                  return (
                    <div key={invitation.enrollmentId} className={styles["invitation-card"]}>
                      <div className={styles["invitation-logo"]}>
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={invitation.organizationName}
                            className={styles["invitation-logo-image"]}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="${styles["invitation-logo-fallback"]}">
                                    ${invitation.organizationName.charAt(0).toUpperCase()}
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className={styles["invitation-logo-fallback"]}>
                            {invitation.organizationName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className={styles["invitation-content"]}>
                        <h3 className={styles["invitation-org-name"]}>
                          {invitation.organizationName}
                        </h3>
                        {invitation.organizationType && (
                          <p className={styles["invitation-org-type"]}>
                            {invitation.organizationType}
                          </p>
                        )}
                        {invitation.invitedAt && (
                          <div className={styles["invitation-date"]}>
                            <Calendar className={styles["invitation-date-icon"]} />
                            <span>Invited {formatDate(invitation.invitedAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles["invitation-actions"]}>
                        <button
                          onClick={() => handleAccept(invitation.enrollmentId)}
                          disabled={isAccepting || isRejecting}
                          className={`${styles["invitation-btn"]} ${styles["invitation-btn-accept"]}`}
                          type="button"
                        >
                          {isAccepting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(invitation.enrollmentId)}
                          disabled={isAccepting || isRejecting}
                          className={`${styles["invitation-btn"]} ${styles["invitation-btn-reject"]}`}
                          type="button"
                        >
                          {isRejecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XIcon className="h-4 w-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className={styles["invitations-pagination"]}>
                <button
                  onClick={() => loadInvitations(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={styles["invitations-pagination-btn"]}
                  type="button"
                >
                  Previous
                </button>
                <span className={styles["invitations-pagination-info"]}>
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => loadInvitations(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className={styles["invitations-pagination-btn"]}
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
