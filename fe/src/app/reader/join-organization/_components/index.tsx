"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import { joinOrganization } from "../api";
import styles from "../styles.module.css";

export default function JoinOrganizationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"joining" | "success" | "error">("joining");
  const [message, setMessage] = useState("");
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    
    // Validate token and handle join process
    const handleJoin = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Invitation token is missing");
      return;
    }

      try {
        // Show loading spinner for at least 1.5 seconds
        const [result] = await Promise.all([
          joinOrganization(token),
          new Promise(resolve => setTimeout(resolve, 1500)),
        ]);
        
        setStatus("success");
        setMessage(result.message || "You have successfully joined the organization");
        setOrganizationName(result.organizationName || null);
        
        // Redirect to organizations list after 3 seconds
        setTimeout(() => {
          router.push("/reader/organizations");
        }, 3000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to join organization. Please try again.";
        setStatus("error");
        setMessage(msg);
      }
    };

    handleJoin();
  }, [searchParams, router]);

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
          {status === "joining" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className={styles["spinner-lg"]}></div>
              </div>
              <h2 className={styles.title}>
                Joining Organization
              </h2>
              <p className={styles["body-text"]}>
                Please wait while we process your invitation...
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
              <h2 className={styles["title-success"]}>
                Successfully Joined!
              </h2>
              {organizationName && (
                <p className={styles["body-text"]}>
                  You have joined <strong>{organizationName}</strong>
                </p>
              )}
              <p className={styles["body-text-spaced"]}>
                {message}
              </p>
              <p className="text-sm text-dark-5 mb-4">
                Redirecting to organizations page in 3 seconds...
              </p>
              <Link
                href="/reader/organizations"
                className={`${styles["link-primary"]} mt-2 inline-block`}
              >
                Click here if not redirected
              </Link>
            </>
          )}

          {status === "error" && (
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
              <h2 className={styles["title-error"]}>
                Join Failed
              </h2>
              <p className={styles["body-text-spaced"]}>
                {message}
              </p>
              <div className={styles.actions}>
                <Link
                  href="/reader/organizations"
                  className={styles["primary-btn"]}
                >
                  View My Organizations
                </Link>
                <Link
                  href="/"
                  className={styles["link-primary"]}
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

