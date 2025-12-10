"use client";

import { useState, useEffect } from "react";
import { Mail, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "@/app/profile/styles.module.css";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onRequestEmailChange: (password: string, newEmail: string, otp: string) => Promise<{ step: string }>;
}

export default function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onRequestEmailChange,
}: ChangeEmailModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"password" | "email" | "verify">("password");
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    newEmail: "",
    otp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep("password");
      setPassword("");
      setNewEmail("");
      setFormData({ password: "", newEmail: "", otp: "" });
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmailForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newEmail) {
      newErrors.newEmail = "New email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = "Invalid email format";
    } else {
      // Normalize both emails to lowercase for comparison
      const normalizedNewEmail = formData.newEmail.toLowerCase().trim();
      const normalizedCurrentEmail = currentEmail.toLowerCase().trim();
      if (normalizedNewEmail === normalizedCurrentEmail) {
        newErrors.newEmail = "New email must be different from current email";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVerifyForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.otp) {
      newErrors.otp = "OTP is required";
    } else if (!/^[0-9]{6}$/.test(formData.otp)) {
      newErrors.otp = "OTP must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      setIsLoading(true);
      const result = await onRequestEmailChange(formData.password, "", "");
      if (result.step === "email") {
        setPassword(formData.password);
        setStep("email");
        setFormData({ ...formData, password: "", newEmail: "" });
      }
    } catch (error: any) {
      // Extract error message from ApiError (axios interceptor wraps errors)
      // ApiError has message property directly, or check response.data.message
      const errorMessage = 
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to verify password";
      
      setErrors({ submit: errorMessage });
      // Show toast error
      showToast({
        type: "error",
        title: "Password Verification Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailForm()) return;

    try {
      setIsLoading(true);
      // Normalize email to lowercase before sending
      const normalizedEmail = formData.newEmail.toLowerCase().trim();
      const result = await onRequestEmailChange(password, normalizedEmail, "");
      if (result.step === "verify") {
        setNewEmail(normalizedEmail);
        setStep("verify");
        setFormData({ ...formData, newEmail: "", otp: "" });
      }
    } catch (error: any) {
      // Extract error message from ApiError (axios interceptor wraps errors)
      // ApiError has message property directly, or check response.data.message
      const errorMessage = 
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to request email change";
      
      setErrors({ submit: errorMessage });
      // Show toast error
      showToast({
        type: "error",
        title: "Email Change Request Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVerifyForm()) return;

    try {
      setIsLoading(true);
      await onRequestEmailChange(password, newEmail, formData.otp);
      onClose();
    } catch (error: any) {
      // Extract error message from ApiError (axios interceptor wraps errors)
      // ApiError has message property directly, or check response.data.message
      const errorMessage = 
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to verify OTP";
      
      setErrors({ submit: errorMessage });
      // Show toast error
      showToast({
        type: "error",
        title: "OTP Verification Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-md"]}`}>
        <div className={styles["modal-card"]}>
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["blue"]}`}>
                <Mail className={`${styles["modal-icon"]} ${styles["blue"]}`} />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Change Email</h3>
                <p className={styles["modal-subtitle"]}>
                  Update your email address
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-btn"]}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "password" ? (
            <form onSubmit={handlePasswordSubmit} className={styles["modal-form"]}>
              <div className={styles["form-fields"]}>
                <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                  <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                    Enter your password <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                  </label>
                  <div className={styles["field-icon-wrapper"]}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: "" });
                      }}
                      placeholder="Enter your password"
                      className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.password ? styles.error : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles["field-toggle-btn"]}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className={styles["field-toggle-icon"]} />
                      ) : (
                        <Eye className={styles["field-toggle-icon"]} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                      <AlertCircle className={styles["error-icon"]} />
                      {errors.password}
                    </div>
                  )}
                </div>

                {errors.submit && (
                  <div className={styles["alert-error"]}>
                    <div className={styles["alert-error-content"]}>
                      <AlertCircle className={styles["alert-icon"]} />
                      {errors.submit}
                    </div>
                  </div>
                )}
              </div>

              <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${styles["btn-cancel"]} ${styles["btn-cancel-sm"]}`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`${styles["btn-submit"]} ${styles["blue"]} ${styles["btn-submit-sm"]}`}
                >
                  {isLoading && (
                    <svg className={styles["spinner"]} fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Verifying..." : "Next"}
                </button>
              </div>
            </form>
          ) : step === "email" ? (
            <form onSubmit={handleEmailSubmit} className={styles["modal-form"]}>
              <div className={styles["form-fields"]}>
                <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                  <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>Current Email</label>
                  <input
                    type="email"
                    value={currentEmail}
                    disabled
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["disabled"]}`}
                  />
                </div>

                <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                  <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                    New Email <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.newEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, newEmail: e.target.value });
                      if (errors.newEmail) setErrors({ ...errors, newEmail: "" });
                    }}
                    placeholder="Enter new email"
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.newEmail ? styles.error : ""}`}
                  />
                  {errors.newEmail && (
                    <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                      <AlertCircle className={styles["error-icon"]} />
                      {errors.newEmail}
                    </div>
                  )}
                </div>

                {errors.submit && (
                  <div className={styles["alert-error"]}>
                    <div className={styles["alert-error-content"]}>
                      <AlertCircle className={styles["alert-icon"]} />
                      {errors.submit}
                    </div>
                  </div>
                )}
              </div>

              <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]}`}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("password");
                    setFormData({ ...formData, newEmail: "" });
                    setErrors({});
                  }}
                  className={`${styles["btn-cancel"]} ${styles["btn-cancel-sm"]}`}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`${styles["btn-submit"]} ${styles["blue"]} ${styles["btn-submit-sm"]}`}
                >
                  {isLoading && (
                    <svg className={styles["spinner"]} fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className={styles["modal-form"]}>
              <div className={styles["form-fields"]}>
                <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                  <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    disabled
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["disabled"]}`}
                  />
                </div>

                <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                  <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                    OTP <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setFormData({ ...formData, otp: value });
                      if (errors.otp) setErrors({ ...errors, otp: "" });
                    }}
                    placeholder="Enter 6-digit OTP"
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.otp ? styles.error : ""}`}
                    maxLength={6}
                  />
                  {errors.otp && (
                    <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                      <AlertCircle className={styles["error-icon"]} />
                      {errors.otp}
                    </div>
                  )}
                </div>

                {errors.submit && (
                  <div className={styles["alert-error"]}>
                    <div className={styles["alert-error-content"]}>
                      <AlertCircle className={styles["alert-icon"]} />
                      {errors.submit}
                    </div>
                  </div>
                )}
              </div>

              <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]}`}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setFormData({ ...formData, otp: "" });
                    setErrors({});
                  }}
                  className={`${styles["btn-cancel"]} ${styles["btn-cancel-sm"]}`}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`${styles["btn-submit"]} ${styles["blue"]} ${styles["btn-submit-sm"]}`}
                >
                  {isLoading && (
                    <svg className={styles["spinner"]} fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Verifying..." : "Verify & Change Email"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

