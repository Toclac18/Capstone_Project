"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import { EmailIcon } from "@/assets/icons";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";
import { requestPasswordReset } from "@/services/auth.service";

type Step = "email" | "otp" | "reset";

export default function ForgotPasswordContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpInputs, setOtpInputs] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await requestPasswordReset({ email });
      setStep("otp");
      showToast({
        type: "success",
        title: "OTP Sent",
        message: "Please check your email. We have sent an OTP for you.",
      });
      // Start countdown for resend (60 seconds)
      setCanResend(false);
      setResendCountdown(60);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Failed to send OTP. Please try again.";

      // Check for email not found error
      if (
        msg.toLowerCase().includes("does not exist") ||
        msg.toLowerCase().includes("not found")
      ) {
        setError("Email does not exist in the system");
      } else {
        setError(msg);
      }

      showToast({
        type: "error",
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setLoading(true);
    setError(null);

    try {
      await requestPasswordReset({ email });
      showToast({
        type: "success",
        title: "OTP Resent",
        message: "A new OTP has been sent to your email.",
      });
      setCanResend(false);
      setResendCountdown(60);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Failed to resend OTP. Please try again.";
      setError(msg);
      showToast({
        type: "error",
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Update OTP string
    const otpString = newOtpInputs.join("");
    setOtp(otpString);
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    // OTP verification is done together with password reset
    // So we just move to reset step
    setStep("reset");
    setError(null);
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return "Password must include letters and numbers";
    }
    return "";
  };

  const validateConfirmPassword = (
    password: string,
    confirm: string,
  ): string => {
    if (!confirm) return "Please confirm your password";
    if (password !== confirm) return "Passwords do not match";
    return "";
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    const error = validatePassword(value);
    setPasswordErrors((prev) => ({
      ...prev,
      newPassword: error,
    }));
    // Also re-validate confirm password if it exists
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(value, confirmPassword);
      setPasswordErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    const error = validateConfirmPassword(newPassword, value);
    setPasswordErrors((prev) => ({
      ...prev,
      confirmPassword: error,
    }));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    const newPasswordError = validatePassword(newPassword);
    const confirmPasswordError = validateConfirmPassword(
      newPassword,
      confirmPassword,
    );

    setPasswordErrors({
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    });

    if (newPasswordError || confirmPasswordError) {
      setLoading(false);
      return;
    }

    try {
      const { resetPassword } = await import("@/services/auth.service");
      await resetPassword({ email, otp, newPassword });
      showToast({
        type: "success",
        title: "Success",
        message: "Your password is reset successfully.",
      });
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Failed to reset password. Please try again.";

      // Check for account locked error
      if (
        msg.toLowerCase().includes("locked") ||
        msg.toLowerCase().includes("too many")
      ) {
        setError(
          "Your account is locked because of too many times trying. Please contact admin if needed.",
        );
        setStep("email"); // Reset to email step
      } else {
        setError(msg);
        // Increment OTP attempts if OTP is incorrect
        if (
          msg.toLowerCase().includes("otp") ||
          msg.toLowerCase().includes("incorrect")
        ) {
          setOtpAttempts((prev) => prev + 1);
          if (otpAttempts + 1 >= 4) {
            // After 4 failed attempts, show warning
            setError(
              "You have one more attempt. After 5 failed attempts, your account will be locked.",
            );
          }
        }
      }

      showToast({
        type: "error",
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["page-container"]}>
      <div className={styles.card}>
        <div className={styles["card-body"]}>
          <div className={styles["logo-row"]}>
            <Link href="/" className="block">
              <Image
                src={Logo}
                alt="Logo"
                width={100}
                height={100}
                className="dark:hidden"
              />
              <Image
                src={LogoDark}
                alt="Logo"
                width={100}
                height={100}
                className="hidden dark:block"
              />
            </Link>
          </div>

          {step === "email" && (
            <>
              <h2 className={styles.title}>Forgot Password - Enter Email</h2>
              {error && <div className={styles["alert-error"]}>{error}</div>}
              <form onSubmit={handleSendOTP}>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  >
                    Enter Email <span className="text-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-[15px] pr-12.5 outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <EmailIcon className="absolute right-4.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="mb-4.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles["submit-btn"]}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                    {loading && <span className={styles.spinner} />}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h2 className={styles.title}>Enter OTP</h2>
              <p className={styles["body-text"]}>
                Please check your email. We have sent an OTP for you.
              </p>
              {error && <div className={styles["alert-error"]}>{error}</div>}
              <form onSubmit={handleVerifyOTP}>
                <div className={styles["otp-container"]}>
                  {otpInputs.map((value, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className={styles["otp-input"]}
                      value={value}
                      onChange={(e) =>
                        handleOtpChange(
                          index,
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      disabled={loading}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <div className={styles["resend-otp"]}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                    className={styles["resend-link"]}
                  >
                    {canResend
                      ? "Resend OTP"
                      : `Resend OTP (${resendCountdown}s)`}
                  </button>
                </div>
                <div className="mb-4.5 mt-6">
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className={styles["submit-btn"]}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                    {loading && <span className={styles.spinner} />}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h2 className={styles.title}>Reset Password</h2>
              {error && <div className={styles["alert-error"]}>{error}</div>}
              <form onSubmit={handleResetPassword}>
                <div className="mb-4">
                  <label
                    htmlFor="newPassword"
                    className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  >
                    New Password <span className="text-red">*</span>
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    className={`w-full rounded-lg border-[1.5px] bg-transparent px-5.5 py-[15px] outline-none transition placeholder:text-dark-6 dark:bg-dark-2 dark:text-white ${
                      passwordErrors.newPassword
                        ? "border-red focus:border-red dark:border-red"
                        : "border-stroke focus:border-primary dark:border-dark-3"
                    }`}
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <p className="mt-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-red">
                    {passwordErrors.newPassword || "\u00A0"}
                  </p>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="confirmPassword"
                    className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  >
                    Confirm New Password <span className="text-red">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className={`w-full rounded-lg border-[1.5px] bg-transparent px-5.5 py-[15px] outline-none transition placeholder:text-dark-6 dark:bg-dark-2 dark:text-white ${
                      passwordErrors.confirmPassword
                        ? "border-red focus:border-red dark:border-red"
                        : "border-stroke focus:border-primary dark:border-dark-3"
                    }`}
                    value={confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <p className="mt-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-red">
                    {passwordErrors.confirmPassword || "\u00A0"}
                  </p>
                </div>
                <div className="mb-4.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles["submit-btn"]}
                  >
                    {loading ? "Resetting..." : "Reset password"}
                    {loading && <span className={styles.spinner} />}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className={styles.footer}>
            <p>
              Remember your password?{" "}
              <Link href="/auth/sign-in" className={styles["link-primary"]}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
