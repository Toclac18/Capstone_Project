"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertDialog } from "@/components/AlertDialog/AlertDialog";
import { ApiError, setApiClientErrorHandler } from "@/lib/apiClient";
import type { ErrorDialogPayload } from "@/server/withErrorBoundary";

export function AlertDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dialog, setDialog] = useState<ErrorDialogPayload | null>(null);

  const close = useCallback(() => setDialog(null), []);

  useEffect(() => {
    // Đăng ký handler global cho apiClient
    setApiClientErrorHandler((error: ApiError) => {
      if (error.dialog) {
        setDialog(error.dialog);
      }
    });

    // Cleanup khi unmount
    return () => setApiClientErrorHandler(null);
  }, []);

  return (
    <>
      {children}

      <AlertDialog
        isOpen={!!dialog}
        variant={dialog?.variant ?? "error"}
        title={dialog?.title}
        description={dialog?.description}
        primaryActionLabel={dialog?.primaryActionLabel ?? "OK"}
        onClose={close}
      />
    </>
  );
}
