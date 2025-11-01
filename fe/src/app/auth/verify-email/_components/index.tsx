"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import { verifyEmail } from "../api";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing");
      return;
    }

    const verify = async () => {
      try {
        // Show loading spinner for at least 3 seconds
        const [result] = await Promise.all([
          verifyEmail(token),
          new Promise(resolve => setTimeout(resolve, 1500)), // 3 second delay
        ]);
        
        setStatus("success");
        setMessage(result.message || "Email has been verified successfully");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 3000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Verification failed. Please try again.";
        setStatus("error");
        setMessage(msg);
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 dark:bg-dark">
      <div className="w-full max-w-md rounded-[10px] bg-white px-7.5 py-10 shadow-1 dark:bg-gray-dark dark:shadow-card">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
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
        <div className="text-center">
          {status === "verifying" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-dark dark:text-white">
                Verifying Your Email
              </h2>
              <p className="text-body-color dark:text-dark-6">
                Please wait while we verify your email address...
              </p>
              
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-10 w-10 text-green-600 dark:text-green-400"
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
              <h2 className="mb-3 text-2xl font-bold text-green-600 dark:text-green-400">
                Email Verified!
              </h2>
              <p className="mb-6 text-body-color dark:text-dark-6">
                {message}
              </p>
              <p className="text-sm text-body-color dark:text-dark-6">
                Redirecting to login page in 3 seconds...
              </p>
              <Link
                href="/auth/sign-in"
                className="mt-4 inline-block text-primary hover:underline"
              >
                Click here if not redirected
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <svg
                    className="h-10 w-10 text-red-600 dark:text-red-400"
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
              <h2 className="mb-3 text-2xl font-bold text-red-600 dark:text-red-400">
                Verification Failed
              </h2>
              <p className="mb-6 text-body-color dark:text-dark-6">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex justify-center rounded-lg bg-primary px-6 py-3 font-medium text-white transition hover:bg-opacity-90"
                >
                  Register Again
                </Link>
                <Link
                  href="/auth/sign-in"
                  className="text-primary hover:underline"
                >
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

