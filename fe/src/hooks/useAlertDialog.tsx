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
  // Xử lý lỗi từ Axios (Global Handler)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[AlertDialogProvider] Connecting to Axios...");

    const handleAxiosError = (error: ApiError) => {
      console.log("[GlobalHandler] Received error status:", error.status);

      const { status } = error;
      const currentPath = pathnameRef.current;
      const currentRouter = routerRef.current;

      // KHÔNG hiện Dialog, mà để cho Component tự xử lý (Show Toast/Inline).
      // 400: Bad Request (Lỗi logic, sai pass...)
      // 422: Validation Failed (Sai form...)
      // 409: Conflict (Trùng email, trùng tên...) -> dùng showToast thay vì dialog
      if (status === 400 || status === 422 || status === 409) {
        // Đánh dấu là chưa được xử lý bởi Global Dialog -> Để Component biết đường show Toast
        error.isHandledGlobally = false;
        return;
      }

      // Đánh dấu là đã xử lý (để Component không show Toast chồng lên Dialog)
      error.isHandledGlobally = true;

      // Các lỗi dùng Alert Dialog và message hardcode
      const serverDialog = error.dialog as ErrorDialogPayload | undefined;
      const baseConfig: ShowAlertOptions = {
        variant: serverDialog?.variant ?? "error",
        title: serverDialog?.title ?? "ERROR OCCURRED",
        description: serverDialog?.description ?? error.message, // Fallback message
        primaryActionLabel: serverDialog?.primaryActionLabel ?? "OK",
        onPrimaryAction: hideAlert,
      };

      switch (status) {
        // 401: Hết phiên -> Login
        case 401:
          if (currentPath?.startsWith("/auth/") || currentPath?.startsWith("/profile") || currentPath?.startsWith("/org-admin/manage-organization")){
            return;
          }
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

        // 403: Không có quyền
        case 403:
          showAlert({
            title: "ACCESS DENIED",
            description: "You do not have permission to perform this action.",
            primaryActionLabel: "OK",
            onPrimaryAction: hideAlert,
          });
          break;

        // 404: Không tìm thấy -> Home
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

        // 500: Lỗi server
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

        // Default (Lỗi mạng, timeout...)
        default:
          showAlert(baseConfig);
          break;
      }
    };

    setApiClientErrorHandler(handleAxiosError);
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

export function useAlertDialog(): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return ctx;
}
