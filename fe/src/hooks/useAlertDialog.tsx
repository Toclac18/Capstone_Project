"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogVariant,
} from "@/components/AlertDialog/AlertDialog";
import { ApiError, setApiClientErrorHandler } from "@/services/http";
import type { ErrorDialogPayload } from "@/server/withErrorBoundary";

// --- Types ---
export interface ShowAlertOptions {
  variant?: AlertDialogVariant;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  primaryActionEndpoint?: string;
  onPrimaryAction?: () => void | Promise<void>;
}

type AlertDialogContextValue = {
  showAlert: (options: ShowAlertOptions) => void;
  showError: (message: string, title?: string) => void;
  hideAlert: () => void;
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

// --- Provider Component ---
export const AlertDialogProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<
    (ShowAlertOptions & { isOpen: boolean }) | null
  >(null);

  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);

  // Update refs after render to avoid mutating refs during render phase
  useEffect(() => {
    routerRef.current = router;
    pathnameRef.current = pathname;
  }, [router, pathname]);

  const hideAlert = useCallback(() => {
    setState((prev) => (prev ? { ...prev, isOpen: false } : prev));
  }, []);

  const showAlert = useCallback((options: ShowAlertOptions) => {
    setState({ ...options, isOpen: true });
  }, []);

  const showError = useCallback(
    (message: string, title = "Something went wrong") => {
      showAlert({
        variant: "error",
        title,
        description: message,
        primaryActionLabel: "OK",
      });
    },
    [showAlert],
  );

  // ─────────────────────────────────────────────────────────────
  // Xử lý lỗi theo Status Code
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("🛠️ [AlertDialogProvider] Connecting to Axios...");

    const handleAxiosError = (error: ApiError) => {
      console.log("⚡ [GlobalHandler] Received error:", error.status);

      const { status } = error;
      const serverDialog = error.dialog as ErrorDialogPayload | undefined;
      const currentPath = pathnameRef.current;
      const currentRouter = routerRef.current;

      // Cấu hình Dialog cơ bản (Fallback)
      const baseConfig: ShowAlertOptions = {
        variant: serverDialog?.variant ?? "error",
        title: serverDialog?.title ?? "ERROR OCCURRED",
        description: serverDialog?.description ?? error.message,
        primaryActionLabel: serverDialog?.primaryActionLabel ?? "OK",
        onPrimaryAction: hideAlert, // Mặc định là đóng dialog
      };

      switch (status) {
        // Unauthorized -> Login
        case 401:
          // Nếu đang ở trang login rồi thì không hiện nữa
          if (currentPath?.includes("/auth/sign-in")) return;

          showAlert({
            title: "SESSION EXPIRED",
            description: "Your session has expired. Please sign in again.",
            primaryActionLabel: "Sign In",
            onPrimaryAction: () => {
              hideAlert();
              currentRouter.push("/auth/sign-in");
            },
          });
          break;

        // Bad Request -> Đóng dialog
        case 400:
          showAlert({
            title: "ERROR REQUEST",
            description: "There was an error with your request.",
            primaryActionLabel: "OK",
            onPrimaryAction: hideAlert, // Chỉ đóng dialog
          });
          break;

        // Forbidden -> Đóng dialog
        case 403:
          showAlert({
            title: "ACCESS DENIED",
            description: "You do not have permission to perform this action.",
            primaryActionLabel: "OK",
            onPrimaryAction: hideAlert, // Chỉ đóng dialog
          });
          break;

        // Not Found -> Homepage
        case 404:
          showAlert({
            title: "NOT FOUND",
            description: "The resource you are looking for does not exist.",
            primaryActionLabel: "Go Home",
            onPrimaryAction: () => {
              hideAlert();
              currentRouter.push("/homepage");
            },
          });
          break;

        // Server Error -> Error Page
        case 500:
          showAlert({
            title: "INTERNAL SERVER ERROR",
            description:
              "An unexpected error occurred on the server. Please try again later.",
            primaryActionLabel: "OK",
            onPrimaryAction: () => {
              hideAlert();
              currentRouter.push("/error-page");
            },
          });
          break;

        // Default: Các lỗi khác -> Đóng dialog
        default:
          showAlert(baseConfig);
          break;
      }
    };

    // Đăng ký handler
    setApiClientErrorHandler(handleAxiosError);

    // Cleanup
    return () => setApiClientErrorHandler(null);
  }, [showAlert, hideAlert]);

  const ctx: AlertDialogContextValue = { showAlert, showError, hideAlert };
  const isOpen = state?.isOpen ?? false;

  return (
    <AlertDialogContext.Provider value={ctx}>
      {children}
      <AlertDialog
        isOpen={isOpen}
        variant={state?.variant ?? "error"}
        title={state?.title}
        description={state?.description}
        primaryActionLabel={state?.primaryActionLabel ?? "OK"}
        primaryActionEndpoint={state?.primaryActionEndpoint}
        onPrimaryAction={state?.onPrimaryAction}
        onClose={hideAlert}
      />
    </AlertDialogContext.Provider>
  );
};

// --- Hook ---
export function useAlertDialog(): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return ctx;
}
