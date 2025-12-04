"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChangeOtp,
  changePassword,
  uploadAvatar,
  deleteAccount,
  type ProfileResponse,
  type ReaderProfileResponse,
  type ReviewerProfileResponse,
} from "@/services/profile.service";
import { useReader } from "@/hooks/useReader";
import {
  Mail,
  Calendar,
  Coins,
  Shield,
  Building2,
  Hash,
  Edit,
  Key,
  Trash2,
  Camera,
  GraduationCap,
  FileText,
  Bell,
} from "lucide-react";
import ChangeEmailModal from "./_components/ChangeEmailModal";
import ChangePasswordModal from "./_components/ChangePasswordModal";
import EditProfileModal from "./_components/EditProfileModal";
import DeleteAccountModal from "./_components/DeleteAccountModal";
import InvitationsModal from "./_components/InvitationsModal";
import { useToast } from "@/components/ui/toast";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { getPendingInvitations } from "@/services/enrollments.service";
import styles from "@/app/profile/styles.module.css";

const AVATAR_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/avatars/";

export default function Page() {
  const { role, loading: authLoading, isAuthenticated } = useReader();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>("/images/user.png");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);
  const [invitationCount, setInvitationCount] = useState<number | null>(null);

  const { showToast } = useToast();

  const loadProfile = useCallback(async () => {
    if (!role) {
      setError("Unable to determine user role");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getProfile(role);
      setProfile(profileData);
      setError(null);

      // Reader and Reviewer use avatarUrl
      const userProfile = profileData as (ReaderProfileResponse | ReviewerProfileResponse) & { role: string };
      const sanitizedUrl = sanitizeImageUrl(userProfile.avatarUrl, AVATAR_BASE_URL, "/images/user.png");
      setProfilePhoto(sanitizedUrl || "/images/user.png");
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && role) {
      loadProfile();
    } else if (!authLoading && !isAuthenticated) {
      setError("Please sign in to view your profile");
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, role, loadProfile]);

  // Load invitation count for READER
  useEffect(() => {
    if (role === "READER" && !authLoading && isAuthenticated) {
      const loadInvitationCount = async () => {
        try {
          const response = await getPendingInvitations({ page: 0, size: 1 });
          setInvitationCount(response.totalElements);
        } catch (error) {
          // Silently fail - don't show error for invitation count
          setInvitationCount(0);
        }
      };
      loadInvitationCount();
    }
  }, [role, authLoading, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (profilePhoto && profilePhoto.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhoto);
      }
      if (previewPhoto) {
        URL.revokeObjectURL(previewPhoto);
      }
    };
  }, [profilePhoto, previewPhoto]);

  const displayName = profile?.fullName || profile?.email || "";
  const coverPhoto = "/images/cover.png";

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));
    const mimeType = file.type.toLowerCase();
    
    const isValidMimeType = mimeType && ALLOWED_MIME_TYPES.includes(mimeType);
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    
    if (!isValidMimeType && !isValidExtension) {
      showToast({
        type: "error",
        title: "Invalid File",
        message: "Please select a JPEG or PNG image file",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast({
        type: "error",
        title: "File Too Large",
        message: "Please select an image smaller than 5MB",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewPhoto(previewUrl);
    setSelectedFile(file);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || !role) return;

    try {
      // All roles upload avatar
      await uploadAvatar(selectedFile);
      
      showToast({
        type: "success",
        title: "Avatar Updated",
        message: "Your avatar has been updated successfully",
      });
      
      await loadProfile();

      setPreviewPhoto(null);
      setSelectedFile(null);
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Upload Failed",
        message: e?.message || "Failed to upload image",
      });
    }
  };

  const handleCancelPhoto = () => {
    if (previewPhoto) {
      URL.revokeObjectURL(previewPhoto);
    }
    setPreviewPhoto(null);
    setSelectedFile(null);
    
    const fileInput = document.getElementById("profilePhoto") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const roleColor = useMemo(() => {
    const r = role || "";
    switch (r) {
      case "READER":
        return "bg-blue-600/10 text-blue-600 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700";
      case "REVIEWER":
        return "bg-emerald-600/10 text-emerald-600 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700";
      case "BUSINESS_ADMIN":
        return "bg-amber-600/10 text-amber-600 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700";
      case "SYSTEM_ADMIN":
        return "bg-rose-600/10 text-rose-600 border-rose-300 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700";
      default:
        return "bg-gray-200 text-gray-700 border-stroke dark:bg-gray-700 dark:text-gray-300";
    }
  }, [role]);

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatEducationLevel = (level?: string) => {
    if (!level) return "-";
    return level
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };


  const handleEditProfile = async (data: Partial<ReaderProfileResponse | ReviewerProfileResponse>) => {
    if (!role) {
      throw new Error("Unable to determine user role");
    }
    await updateProfile(role, data);
    showToast({
      type: "success",
      title: "Profile Updated",
      message: "Your profile has been updated successfully",
    });
    await loadProfile();
  };

  const handleChangeEmail = async (newEmail: string, otp: string) => {
    if (!otp) {
      await requestEmailChange(newEmail);
      showToast({
        type: "success",
        title: "OTP Sent",
        message: "OTP has been sent to your current email address",
      });
      return { step: "verify" };
    }
    
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

  const handleDeleteAccount = async () => {
    await deleteAccount();
    showToast({
      type: "success",
      title: "Account Deleted",
      message: "Your account has been deleted successfully",
    });
    setTimeout(() => {
      window.location.href = "/auth/sign-in";
    }, 2000);
  };

  if (authLoading || loading) {
    return (
      <div className={styles["profile-container"]}>
        <Breadcrumb pageName="Profile" />
        <div className={styles["profile-loading"]}>
          <div className={styles["profile-loading-skeleton"]} />
          <div className={styles["profile-loading-skeleton-large"]} />
        </div>
      </div>
    );
  }

  if (error || !isAuthenticated || !role) {
    return (
      <div className={styles["profile-container"]}>
        <Breadcrumb pageName="Profile" />
        <div className={styles["profile-error"]}>
          {error || "Please sign in to view your profile"}
        </div>
      </div>
    );
  }

  return (
    <div className={styles["profile-container"]}>
      <Breadcrumb pageName="Profile" />

      {/* Profile Card */}
      <div className={styles["profile-card"]}>
        {/* Cover Photo */}
        <div className={styles["profile-cover"]}>
          <Image
            src={coverPhoto}
            alt="profile cover"
            className={styles["profile-cover-image"]}
            width={970}
            height={260}
            loading="eager"
            priority
          />
          {/* Role badge */}
          {role && (
            <span className={`${styles["profile-role-badge"]} ${roleColor}`}>
              <Shield className="h-3.5 w-3.5" />
              {role.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Profile Content */}
        <div className={styles["profile-content"]}>
          {/* Profile Photo */}
          <div className={styles["profile-photo-wrapper"]}>
            <div className={styles["profile-photo-container"]}>
              {(() => {
                const imageSrc = previewPhoto || profilePhoto || "/images/user.png";
                const isExternalUrl = imageSrc.startsWith("http://") || imageSrc.startsWith("https://");
                const isBlobUrl = imageSrc.startsWith("blob:");
                
                if (isExternalUrl || isBlobUrl) {
                  return (
                    <img
                      src={imageSrc}
                      alt="profile"
                      className={styles["profile-photo-image"]}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== "/images/user.png") {
                          target.src = "/images/user.png";
                        }
                      }}
                    />
                  );
                }
                
                return (
                  <Image
                    src={imageSrc}
                    fill
                    className={styles["profile-photo-image"]}
                    alt="profile"
                    sizes="(max-width: 640px) 144px, 208px"
                  />
                );
              })()}
              {!previewPhoto && (
                <label
                  htmlFor="profilePhoto"
                  className={styles["profile-photo-label"]}
                >
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    name="profilePhoto"
                    id="profilePhoto"
                    className={styles["profile-photo-input"]}
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleProfilePhotoChange}
                  />
                </label>
              )}
              {previewPhoto && (
                <div className={styles["profile-photo-actions"]}>
                  <button
                    onClick={handleSavePhoto}
                    className={styles["profile-photo-save"]}
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelPhoto}
                    className={styles["profile-photo-cancel"]}
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className={styles["profile-user-info"]}>
            <h3 className={styles["profile-display-name"]}>{displayName}</h3>

            {/* Action Buttons */}
            <div className={styles["profile-actions"]}>
              {(role === "READER" || role === "REVIEWER") && (
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className={styles["btn-edit-profile"]}
                >
                  <Edit className={styles["btn-icon"]} />
                  Edit Profile
                </button>
              )}
              <button
                onClick={() => setIsChangeEmailOpen(true)}
                className={styles["btn-change-email"]}
              >
                <Mail className={styles["btn-icon"]} />
                Change Email
              </button>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className={styles["btn-change-password"]}
              >
                <Key className={styles["btn-icon"]} />
                Change Password
              </button>
              <button
                onClick={() => setIsDeleteAccountOpen(true)}
                className={styles["btn-delete-account"]}
              >
                <Trash2 className={styles["btn-icon"]} />
                Delete Account
              </button>
            </div>

            {/* Invitations Banner - Only for READER, only show when there are invitations */}
            {role === "READER" && invitationCount !== null && invitationCount > 0 && (
              <div
                className={styles["invitations-banner"]}
                onClick={() => setIsInvitationsOpen(true)}
              >
                <div className={styles["invitations-banner-icon"]}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className={styles["invitations-banner-content"]}>
                  <p className={styles["invitations-banner-title"]}>
                    You have {invitationCount} pending {invitationCount === 1 ? "invitation" : "invitations"}
                  </p>
                  <p className={styles["invitations-banner-subtitle"]}>
                    Click to view and manage
                  </p>
                </div>
                <div className={styles["invitations-badge"]}>
                  {invitationCount}
                </div>
              </div>
            )}

            {/* Profile Details Card */}
            <div
              className={`${styles["profile-details-card"]} ${styles["sm-cols-2"]}`}
            >
              {profile?.email && (
                <div className={styles["profile-detail-item"]}>
                  <div
                    className={`${styles["profile-detail-icon-wrapper"]} ${styles["primary"]}`}
                  >
                    <Mail
                      className={`${styles["profile-detail-icon"]} ${styles["primary"]}`}
                    />
                  </div>
                  <div>
                    <p className={styles["profile-detail-label"]}>Email</p>
                    <p className={styles["profile-detail-value"]}>
                      {profile.email}
                    </p>
                  </div>
                </div>
              )}
              {/* Reader/Reviewer common fields */}
              {(role === "READER" || role === "REVIEWER") && (
                <>
                  {role === "READER" && (profile as ReaderProfileResponse & { role: "READER" })?.dob && (
                    <div className={styles["profile-detail-item"]}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["blue"]}`}
                      >
                        <Calendar
                          className={`${styles["profile-detail-icon"]} ${styles["blue"]}`}
                        />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>
                          Date of Birth
                        </p>
                        <p className={styles["profile-detail-value"]}>
                          {formatDate((profile as ReaderProfileResponse & { role: "READER" }).dob || undefined)}
                        </p>
                      </div>
                    </div>
                  )}
                  {role === "REVIEWER" && (profile as ReviewerProfileResponse & { role: "REVIEWER" })?.dateOfBirth && (
                    <div className={styles["profile-detail-item"]}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["blue"]}`}
                      >
                        <Calendar
                          className={`${styles["profile-detail-icon"]} ${styles["blue"]}`}
                        />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>
                          Date of Birth
                        </p>
                        <p className={styles["profile-detail-value"]}>
                          {formatDate((profile as ReviewerProfileResponse & { role: "REVIEWER" }).dateOfBirth || undefined)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className={styles["profile-detail-item"]}>
                    <div
                      className={`${styles["profile-detail-icon-wrapper"]} ${styles["yellow"]}`}
                    >
                      <Coins
                        className={`${styles["profile-detail-icon"]} ${styles["yellow"]}`}
                      />
                    </div>
                    <div>
                      <p className={styles["profile-detail-label"]}>
                        Points
                      </p>
                      <p className={styles["profile-detail-value"]}>
                        {(profile?.point ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Reviewer specific fields */}
              {role === "REVIEWER" && (
                <>
                  {(profile as ReviewerProfileResponse & { role: "REVIEWER" })?.educationLevel && (
                    <div className={styles["profile-detail-item"]}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["blue"]}`}
                      >
                        <GraduationCap
                          className={`${styles["profile-detail-icon"]} ${styles["blue"]}`}
                        />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Education Level</p>
                        <p className={styles["profile-detail-value"]}>
                          {formatEducationLevel((profile as ReviewerProfileResponse & { role: "REVIEWER" }).educationLevel)}
                        </p>
                      </div>
                    </div>
                  )}
                  {(profile as ReviewerProfileResponse & { role: "REVIEWER" })?.organizationName && (
                    <div className={styles["profile-detail-item"]}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["blue"]}`}
                      >
                        <Building2
                          className={`${styles["profile-detail-icon"]} ${styles["blue"]}`}
                        />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Organization</p>
                        <p className={styles["profile-detail-value"]}>
                          {(profile as ReviewerProfileResponse & { role: "REVIEWER" }).organizationName}
                        </p>
                      </div>
                    </div>
                  )}
                  {(profile as ReviewerProfileResponse & { role: "REVIEWER" })?.organizationEmail && (
                    <div className={styles["profile-detail-item"]}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["primary"]}`}
                      >
                        <Mail
                          className={`${styles["profile-detail-icon"]} ${styles["primary"]}`}
                        />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Organization Email</p>
                        <p className={styles["profile-detail-value"]}>
                          {(profile as ReviewerProfileResponse & { role: "REVIEWER" }).organizationEmail}
                        </p>
                      </div>
                    </div>
                  )}
                  {(profile as ReviewerProfileResponse & { role: "REVIEWER" })?.ordid && (
                    <div className={styles["profile-detail-item"]}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["purple"]}`}
                      >
                        <Hash
                          className={`${styles["profile-detail-icon"]} ${styles["purple"]}`}
                        />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>ORCID</p>
                        <p className={styles["profile-detail-value"]}>
                          {(profile as ReviewerProfileResponse & { role: "REVIEWER" }).ordid}
                        </p>
                      </div>
                    </div>
                  )}
                  {(profile as ReviewerProfileResponse & { role: "REVIEWER" })?.credentialFileUrls &&
                    (profile as ReviewerProfileResponse & { role: "REVIEWER" }).credentialFileUrls.length > 0 && (
                    <div className={`${styles["profile-detail-item"]} ${styles["profile-detail-item-full-width"]}`}>
                      <div
                        className={`${styles["profile-detail-icon-wrapper"]} ${styles["green"]}`}
                      >
                        <FileText
                          className={`${styles["profile-detail-icon"]} ${styles["green"]}`}
                        />
                      </div>
                      <div style={{ width: "100%" }}>
                        <p className={styles["profile-detail-label"]}>Certificate Files</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                          {(profile as ReviewerProfileResponse & { role: "REVIEWER" }).credentialFileUrls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles["profile-detail-value"]}
                              style={{
                                color: "var(--primary-color, #6366f1)",
                                textDecoration: "underline",
                                wordBreak: "break-all",
                              }}
                            >
                              Certificate {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        onSave={handleEditProfile}
      />
      <ChangeEmailModal
        isOpen={isChangeEmailOpen}
        onClose={() => setIsChangeEmailOpen(false)}
        currentEmail={profile?.email || ""}
        onRequestEmailChange={async (newEmail: string, otp?: string) => {
          return await handleChangeEmail(newEmail, otp || "");
        }}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChangePassword={handleChangePassword}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
        email={profile?.email || ""}
        onDelete={() => handleDeleteAccount()}
      />
      {role === "READER" && (
        <InvitationsModal
          isOpen={isInvitationsOpen}
          onClose={() => setIsInvitationsOpen(false)}
          onInvitationAccepted={() => {
            // Decrease invitation count directly without reloading
            setInvitationCount((prev) => {
              if (prev === null || prev <= 0) return 0;
              return prev - 1;
            });
          }}
          onInvitationRejected={() => {
            // Decrease invitation count directly without reloading
            setInvitationCount((prev) => {
              if (prev === null || prev <= 0) return 0;
              return prev - 1;
            });
          }}
        />
      )}
    </div>
  );
}
