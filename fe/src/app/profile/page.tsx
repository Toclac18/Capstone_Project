"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  getProfile,
  updateProfile,
  changeEmail,
  changePassword,
  deleteAccount,
  type ProfileResponse,
  type UserRole,
} from "@/services/profileService";
import {
  Mail,
  MapPin,
  Phone,
  Calendar,
  Coins,
  Shield,
  Building2,
  User as UserIcon,
  Hash,
  Edit,
  Key,
  Trash2,
  Camera,
} from "lucide-react";
import ChangeEmailModal from "./_components/ChangeEmailModal";
import ChangePasswordModal from "./_components/ChangePasswordModal";
import EditProfileModal from "./_components/EditProfileModal";
import DeleteAccountModal from "./_components/DeleteAccountModal";
import { useToast } from "@/components/ui/toast";
import styles from "@/app/profile/styles.module.css";

export default function Page() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>("/images/user.png"); // Profile photo state

  // Modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (profilePhoto && profilePhoto.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhoto);
      }
    };
  }, [profilePhoto]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setProfile(profile);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Computed values from profile
  const displayName = profile?.fullName || profile?.username || profile?.email || "";
  const coverPhoto = "/images/cover.png"; // Default cover photo (fixed)

  // Handle profile photo change
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast({
          type: "error",
          title: "Invalid File",
          message: "Please select an image file",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: "error",
          title: "File Too Large",
          message: "Please select an image smaller than 5MB",
        });
        return;
      }

      // Revoke old URL if exists
      if (profilePhoto && profilePhoto.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhoto);
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePhoto(previewUrl);

      // TODO: Upload to server here
      // For now, just show preview
      showToast({
        type: "success",
        title: "Photo Updated",
        message: "Profile photo has been updated (preview only)",
      });
    }
  };

  const roleColor = useMemo(() => {
    const r = (profile?.role || "") as UserRole | "";
    switch (r) {
      case "READER":
        return "bg-blue-600/10 text-blue-600 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700";
      case "REVIEWER":
        return "bg-emerald-600/10 text-emerald-600 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700";
      case "ORGANIZATION":
        return "bg-purple-600/10 text-purple-600 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700";
      case "BUSINESS_ADMIN":
        return "bg-amber-600/10 text-amber-600 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700";
      case "SYSTEM_ADMIN":
        return "bg-rose-600/10 text-rose-600 border-rose-300 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700";
      default:
        return "bg-gray-200 text-gray-700 border-stroke dark:bg-gray-700 dark:text-gray-300";
    }
  }, [profile?.role]);

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

  // Action handlers
  const handleEditProfile = async (data: Partial<ProfileResponse>) => {
    await updateProfile(data);
    showToast({
      type: "success",
      title: "Profile Updated",
      message: "Your profile has been updated successfully",
    });
    await loadProfile();
  };

  const handleChangeEmail = async (newEmail: string, password: string) => {
    await changeEmail(newEmail, password);
    showToast({
      type: "success",
      title: "Email Changed",
      message: "Your email has been changed successfully",
    });
    await loadProfile();
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    await changePassword(currentPassword, newPassword);
    showToast({
      type: "success",
      title: "Password Changed",
      message: "Your password has been changed successfully",
    });
  };

  const handleDeleteAccount = async (password: string, confirmText: string) => {
    await deleteAccount(password);
    showToast({
      type: "success",
      title: "Account Deleted",
      message: "Your account has been deleted successfully",
    });
    // Redirect to login or home
    setTimeout(() => {
      window.location.href = "/auth/sign-in";
    }, 2000);
  };

  if (loading) {
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

  if (error) {
    return (
      <div className={styles["profile-container"]}>
        <Breadcrumb pageName="Profile" />
        <div className={styles["profile-error"]}>{error}</div>
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
          />
          {/* Role badge */}
          {profile?.role && (
            <span className={`${styles["profile-role-badge"]} ${roleColor}`}>
              <Shield className="h-3.5 w-3.5" />
              {profile.role.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Profile Content */}
        <div className={styles["profile-content"]}>
          {/* Profile Photo */}
          <div className={styles["profile-photo-wrapper"]}>
            <div className={styles["profile-photo-container"]}>
              <Image
                src={profilePhoto}
                width={160}
                height={160}
                className={styles["profile-photo-image"]}
                alt="profile"
              />
              <label htmlFor="profilePhoto" className={styles["profile-photo-label"]}>
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  name="profilePhoto"
                  id="profilePhoto"
                  className={styles["profile-photo-input"]}
                  accept="image/png, image/jpg, image/jpeg, image/webp"
                  onChange={handleProfilePhotoChange}
                />
              </label>
            </div>
          </div>

          {/* User Info */}
          <div className={styles["profile-user-info"]}>
            <h3 className={styles["profile-display-name"]}>{displayName}</h3>

            {/* Action Buttons */}
            <div className={styles["profile-actions"]}>
              {(profile?.role === "READER" || profile?.role === "REVIEWER") && (
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

            {/* Profile Details Card */}
            <div className={`${styles["profile-details-card"]} ${styles["sm-cols-2"]}`}>
              {profile?.email && (
                <div className={styles["profile-detail-item"]}>
                  <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["primary"]}`}>
                    <Mail className={`${styles["profile-detail-icon"]} ${styles["primary"]}`} />
                  </div>
                  <div>
                    <p className={styles["profile-detail-label"]}>Email</p>
                    <p className={styles["profile-detail-value"]}>{profile.email}</p>
                  </div>
                </div>
              )}
              {profile?.dateOfBirth && (
                <div className={styles["profile-detail-item"]}>
                  <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["blue"]}`}>
                    <Calendar className={`${styles["profile-detail-icon"]} ${styles["blue"]}`} />
                  </div>
                  <div>
                    <p className={styles["profile-detail-label"]}>Date of Birth</p>
                    <p className={styles["profile-detail-value"]}>{formatDate(profile.dateOfBirth)}</p>
                  </div>
                </div>
              )}
              {profile?.username && (
                <div className={styles["profile-detail-item"]}>
                  <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["primary"]}`}>
                    <UserIcon className={`${styles["profile-detail-icon"]} ${styles["primary"]}`} />
                  </div>
                  <div>
                    <p className={styles["profile-detail-label"]}>Username</p>
                    <p className={styles["profile-detail-value"]}>{profile?.username}</p>
                  </div>
                </div>
              )}
              {profile?.coinBalance && (
                <div className={styles["profile-detail-item"]}>
                  <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["yellow"]}`}>
                    <Coins className={`${styles["profile-detail-icon"]} ${styles["yellow"]}`} />
                  </div>
                  <div>
                    <p className={styles["profile-detail-label"]}>Coin Balance</p>
                    <p className={styles["profile-detail-value"]}>
                      {profile?.coinBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {profile?.role === "REVIEWER" && profile.ordid && (
                <div className={styles["profile-detail-item"]}>
                  <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["purple"]}`}>
                    <Hash className={`${styles["profile-detail-icon"]} ${styles["purple"]}`} />
                  </div>
                  <div>
                    <p className={styles["profile-detail-label"]}>ORDID</p>
                    <p className={styles["profile-detail-value"]}>{profile?.ordid}</p>
                  </div>
                </div>
              )}

              {profile?.role === "ORGANIZATION" && (
                <>
                  {profile?.organizationName && (
                    <div className={styles["profile-detail-item"]}>
                      <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["blue"]}`}>
                        <Building2 className={`${styles["profile-detail-icon"]} ${styles["blue"]}`} />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Organization</p>
                        <p className={styles["profile-detail-value"]}>{profile?.organizationName}</p>
                      </div>
                    </div>
                  )}
                  {profile?.organizationEmail && (
                    <div className={styles["profile-detail-item"]}>
                      <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["primary"]}`}>
                        <Mail className={`${styles["profile-detail-icon"]} ${styles["primary"]}`} />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Org Email</p>
                        <p className={styles["profile-detail-value"]}>{profile?.organizationEmail}</p>
                      </div>
                    </div>
                  )}
                  {profile?.organizationHotline && (
                    <div className={styles["profile-detail-item"]}>
                      <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["green"]}`}>
                        <Phone className={`${styles["profile-detail-icon"]} ${styles["green"]}`} />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Hotline</p>
                        <p className={styles["profile-detail-value"]}>{profile?.organizationHotline}</p>
                      </div>
                    </div>
                  )}
                  {profile?.organizationAddress && (
                    <div className={`${styles["profile-detail-item"]} ${styles["profile-detail-item-full-width"]}`}>
                      <div className={`${styles["profile-detail-icon-wrapper"]} ${styles["orange"]}`}>
                        <MapPin className={`${styles["profile-detail-icon"]} ${styles["orange"]}`} />
                      </div>
                      <div>
                        <p className={styles["profile-detail-label"]}>Address</p>
                        <p className={styles["profile-detail-value"]}>{profile?.organizationAddress}</p>
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
        onSave={handleChangeEmail}
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
        onDelete={handleDeleteAccount}
      />
    </div>
  );
}
