"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Phone, MapPin, User, Mail, Building2, Tag, FileText, Calendar, Key } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { logout } from "@/services/auth.service";
import {
  requestEmailChange,
  verifyEmailChangeOtp,
  verifyPasswordForEmailChange,
  changePassword,
} from "@/services/profile.service";
import {
  fetchOrganizationInfo,
  deleteOrganization,
  type OrganizationInfo,
} from "./api";
import DeleteOrganizationModal from "./_components/DeleteOrganizationModal";
import ChangeEmailModal from "@/app/profile/_components/ChangeEmailModal";
import ChangePasswordModal from "@/app/profile/_components/ChangePasswordModal";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { formatOrganizationType } from "./utils";
import styles from "./styles.module.css";

const LOGO_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/org-logos/";

type LoadState = "loading" | "success" | "error";

export default function ManageOrganizationPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const run = async () => {
      setState("loading");
      setError(null);
      try {
        const data = await fetchOrganizationInfo();
        setOrgInfo(data);
        setState("success");
      } catch (e: any) {
        setError(
          e?.message ||
            "Unable to load organization information. Please try again later.",
        );
        setState("error");
      }
    };
    run();
  }, []);

  const logoUrl = useMemo(() => {
    const logo = orgInfo?.logo;
    if (!logo || logoError) return null;
    return sanitizeImageUrl(logo, LOGO_BASE_URL, null);
  }, [orgInfo?.logo, logoError]);


  const handleChangeEmail = async (password: string, newEmail: string, otp: string) => {
    // Step 1: Verify password only
    if (password && !newEmail && !otp) {
      await verifyPasswordForEmailChange(password);
      return { step: "email" };
    }
    
    // Step 2: Request email change (password + newEmail) - sends OTP
    if (password && newEmail && !otp) {
      await requestEmailChange(password, newEmail);
      showToast({
        type: "success",
        title: "OTP Sent",
        message: "OTP has been sent to your new email address",
      });
      return { step: "verify" };
    }
    
    // Step 3: Verify OTP and complete email change
    if (password && newEmail && otp) {
      await verifyEmailChangeOtp(otp);
      showToast({
        type: "success",
        title: "Email Changed",
        message: "Your email has been changed successfully. Please login again with your new email",
      });
      
      setTimeout(() => {
        window.location.href = "/auth/sign-in";
      }, 2000);
      
      return { step: "complete" };
    }
    
    return { step: "error" };
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    await changePassword(currentPassword, newPassword, confirmPassword);
    showToast({
      type: "success",
      title: "Password Changed",
      message: "Your password has been changed successfully",
    });
  };

  const handleDelete = async (password: string) => {
    try {
      await deleteOrganization(password);
      showToast({
        type: "success",
        title: "Organization Deleted",
        message:
          "Organization has been deleted successfully. You will be logged out.",
        duration: 3000,
      });

      // Auto logout after 2 seconds
      setTimeout(async () => {
        try {
          await logout();
        } catch (e: any) {
          showToast({
            type: "error",
            title: "Logout Failed",
            message: e?.message || "Failed to logout. Please try again.",
            duration: 5000,
          });
        }
        router.push("/auth/sign-in");
      }, 2000);
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message:
          e?.message || "Failed to delete organization. Please try again.",
        duration: 5000,
      });
      throw e;
    }
  };

  return (
    <div className={styles["page-container"]}>
      <Breadcrumb pageName="Manage Organization" />

      {state === "loading" && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>{error}</div>
      )}

      {state === "success" && orgInfo && (
        <div className={styles["card"]}>
          {/* Header with Logo */}
          <div className={styles["header-section"]}>
            <div className={styles["logo-container"]}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="organization logo"
                  className={styles["logo"]}
                  style={{ objectFit: "cover" }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className={styles["logo-fallback"]}>
                  <span className={styles["logo-fallback-text"]}>
                    {orgInfo.name?.charAt(0)?.toUpperCase() || "O"}
                  </span>
                </div>
              )}
            </div>
            <div className={styles["header-info"]}>
              <div className={styles["header-info-top"]}>
                <div>
                  <h2 className={styles["org-name"]}>{orgInfo.name}</h2>
                  <p className={styles["org-type"]}>
                    {formatOrganizationType(orgInfo.type)}
                  </p>
                </div>
                <div className={styles["header-primary-actions"]}>
                  <button
                    onClick={() => router.push("/org-admin/manage-organization/edit")}
                    className={styles["btn-update"]}
                  >
                    <Edit2 className="h-4 w-4" />
                    Update
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className={styles["btn-delete"]}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles["header-secondary-actions"]}>
                <button
                  onClick={() => setIsChangeEmailOpen(true)}
                  className={styles["btn-change-email"]}
                >
                  <Mail className="h-4 w-4" />
                  Change Email
                </button>
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className={styles["btn-change-password"]}
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className={styles["details-section"]}>
            {/* Admin Information */}
            <div className={styles["info-section"]}>
              <div className={styles["section-header"]}>
                <User className={styles["section-icon"]} />
                <h3 className={styles["section-title"]}>
                  Admin Information
                </h3>
              </div>
              <div className={styles["details-grid"]}>
                <div className={styles["detail-field"]}>
                  <div className={styles["detail-label"]}>
                    <User className="inline h-4 w-4 mr-1" />
                    Admin Name
                  </div>
                  <div className={styles["detail-value"]}>
                    {orgInfo.adminName || "N/A"}
                  </div>
                </div>

                {orgInfo.adminEmail && (
                  <div className={styles["detail-field"]}>
                    <div className={styles["detail-label"]}>
                      <Mail className="inline h-4 w-4 mr-1" />
                      Admin Email
                    </div>
                    <div className={styles["detail-value"]}>{orgInfo.adminEmail}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Information */}
            <div className={styles["info-section"]}>
              <div className={styles["section-header"]}>
                <Building2 className={styles["section-icon"]} />
                <h3 className={styles["section-title"]}>
                  Organization Information
                </h3>
              </div>
              <div className={styles["details-grid"]}>
                <div className={styles["detail-field"]}>
                  <div className={styles["detail-label"]}>
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Organization Name
                  </div>
                  <div className={styles["detail-value"]}>{orgInfo.name}</div>
                </div>

                <div className={styles["detail-field"]}>
                  <div className={styles["detail-label"]}>
                    <Tag className="inline h-4 w-4 mr-1" />
                    Organization Type
                  </div>
                  <div className={styles["detail-value"]}>
                    {formatOrganizationType(orgInfo.type)}
                  </div>
                </div>

                <div className={styles["detail-field"]}>
                  <div className={styles["detail-label"]}>
                    <FileText className="inline h-4 w-4 mr-1" />
                    Registration Number
                  </div>
                  <div className={styles["detail-value"]}>
                    {orgInfo.registrationNumber}
                  </div>
                </div>

                <div className={styles["detail-field"]}>
                  <div className={styles["detail-label"]}>
                    <Mail className="inline h-4 w-4 mr-1" />
                    Organization Email
                  </div>
                  <div className={styles["detail-value"]}>{orgInfo.email}</div>
                </div>

                {orgInfo.hotline && (
                  <div className={styles["detail-field"]}>
                    <div className={styles["detail-label"]}>
                      <Phone className="inline h-4 w-4 mr-1" />
                      Hotline
                    </div>
                    <div className={styles["detail-value"]}>{orgInfo.hotline}</div>
                  </div>
                )}

                <div className={styles["detail-field"]}>
                  <div className={styles["detail-label"]}>
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Created Date
                  </div>
                  <div className={styles["detail-value"]}>
                    {new Date(orgInfo.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {orgInfo.address && (
                  <div className={styles["detail-field-full"]}>
                    <div className={styles["detail-label"]}>
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Address
                    </div>
                    <div className={styles["detail-value"]}>{orgInfo.address}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {orgInfo && (
        <>
          <ChangeEmailModal
            isOpen={isChangeEmailOpen}
            onClose={() => setIsChangeEmailOpen(false)}
            currentEmail={orgInfo.adminEmail || orgInfo.email || ""}
            onRequestEmailChange={handleChangeEmail}
          />
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
            onChangePassword={handleChangePassword}
          />
          <DeleteOrganizationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
            organizationName={orgInfo.name}
            email={orgInfo.adminEmail || orgInfo.email || ""}
          />
        </>
      )}
    </div>
  );
}
