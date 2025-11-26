"use client";

import {
  AlertDialog,
  AlertDialogVariant,
} from "@/components/AlertDialog/AlertDialog";
import React, { createContext, useCallback, useContext, useState } from "react";

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

export const AlertDialogProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<
    (ShowAlertOptions & { isOpen: boolean }) | null
  >(null);

  const hideAlert = useCallback(() => {
    setState((prev) => (prev ? { ...prev, isOpen: false } : prev));
  }, []);

  const showAlert = useCallback((options: ShowAlertOptions) => {
    setState({
      ...options,
      isOpen: true,
    });
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

  const ctx: AlertDialogContextValue = {
    showAlert,
    showError,
    hideAlert,
  };

  const isOpen = state?.isOpen ?? false;

  return (
    <AlertDialogContext.Provider value={ctx}>
      {children}
      <AlertDialog
        isOpen={isOpen}
        variant={state?.variant ?? "info"}
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
