"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import { verifyEmail } from "../api";
import { resendVerificationEmail } from "@/services/auth.service";
import { useToast } from "@/components/ui/toast";
import { decodeJwtPayload, extractEmail } from "@/utils/jwt";
import styles from "../styles.module.css";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "resend">(() =>
    token ? "verifying" : "error",
  );
  const [message, setMessage] = useState<string>(() =>
    token ? "" : "Verification token is missing",
  );
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const emailRef = useRef<string>("");

  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!token || verifiedRef.current) return;

    verifiedRef.current = true;

    // Extract email from token
    const payload = decodeJwtPayload(token);
    const extractedEmail = extractEmail(payload);
    if (extractedEmail) {
      emailRef.current = extractedEmail;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setEmail(extractedEmail);
      }, 0);
    }

    const run = async () => {
      try {
        await Promise.all([
          verifyEmail(token),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);

        setStatus("success");
        // Backend returns AuthResponse, show success message
        setMessage("Email has been verified successfully! You can now login.");
        // Reset countdown to 3 when status changes to success
        setCountdown(3);
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : "Verification failed. Please try again.";
        
        // Check if token is expired or invalid
        const isExpired = msg.toLowerCase().includes("expired") || 
                         msg.toLowerCase().includes("invalid") ||
                         msg.toLowerCase().includes("token");
        
        if (isExpired && token) {
          // Use ref to get email without waiting for state update
          const emailToUse = emailRef.current || extractedEmail || "";
          setIsTokenExpired(true);
          setStatus("resend");
          setMessage(
            emailToUse
              ? "Your verification link has expired. Click the button below to receive a new verification link."
              : "Your verification link has expired. Please contact support."
          );
        } else {
          setStatus("error");
          setMessage(msg);
        }
      }
    };

    run();
  }, [token, router]);

  // Countdown timer for redirect
  useEffect(() => {
    if (status !== "success") return;

    if (countdown === 0) {
      router.push("/auth/sign-in");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/sign-in");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, countdown, router]);

  return (
    <div className={styles["page-container"]}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles["logo-row"]}>
          <Link href="/" className="block">
            <Image
              width={176}
              height={32}
              src={Logo}
              alt="Logo"
              priority
              className="dark:hidden"
              style={{ width: "auto", height: "auto" }}
            />
            <Image
              width={176}
              height={32}
              src={LogoDark}
              alt="Logo"
              priority
              className="hidden dark:block"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
        </div>

        {/* Content */}
        <div className={styles.center}>
          {status === "verifying" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className={styles["spinner-lg"]}></div>
              </div>
              <h2 className={styles.title}>Verifying Your Email</h2>
              <p className={styles["body-text"]}>
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className={styles["success-icon"]}>
                <div>
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className={styles["title-success"]}>Email Verified!</h2>
              <p className={styles["body-text-spaced"]}>{message}</p>
              <p className="text-sm">
                Redirecting to login page in <span className="font-semibold text-primary">{countdown}</span> {countdown === 1 ? "second" : "seconds"}...
              </p>
              <Link
                href="/auth/sign-in"
                className={`${styles["link-primary"]} mt-4 inline-block`}
              >
                Click here to redirect to login
              </Link>
            </>
          )}

          {status === "resend" && (
            <>
              <div className={styles["error-icon"]}>
                <div>
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className={styles["title-error"]}>Verification Link Expired</h2>
              <p className={styles["body-text-spaced"]}>{message}</p>
              {email ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={async () => {
                      setResendLoading(true);
                      try {
                        await resendVerificationEmail({ email });
                        showToast({
                          type: "success",
                          title: "Email Sent",
                          message: "A new verification link has been sent to your email. Please check your inbox.",
                        });
                        // Redirect to login after 2 seconds
                        setTimeout(() => {
                          router.push("/auth/sign-in");
                        }, 2000);
                      } catch (error) {
                        const msg =
                          error instanceof Error
                            ? error.message
                            : "Failed to resend verification email";
                        showToast({
                          type: "error",
                          title: "Error",
                          message: msg,
                        });
                        setResendLoading(false);
                      }
                    }}
                    disabled={resendLoading}
                    className={styles["primary-btn"]}
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                    {resendLoading && <span className={styles.spinner} />}
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <p className={styles["body-text"]}>
                    Unable to extract email from token. Please contact support.
                  </p>
                </div>
              )}
              <div className="mt-4 text-center">
                <Link href="/auth/sign-in" className={styles["link-primary"]}>
                  Back to Login
                </Link>
              </div>
            </>
          )}

          {status === "error" && !isTokenExpired && (
            <>
              <div className={styles["error-icon"]}>
                <div>
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h2 className={styles["title-error"]}>Verification Failed</h2>
              <p className={styles["body-text-spaced"]}>{message}</p>
              <div className={styles.actions}>
                <Link href="/auth/sign-up" className={styles["primary-btn"]}>
                  Register Again
                </Link>
                <Link href="/auth/sign-in" className={styles["link-primary"]}>
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailContent() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
