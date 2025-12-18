"use client";

import React, { createContext, useContext, useState } from "react";
import { createImport, ImportResult } from "@/services/org-admin-imports.service";

type Ctx = {
  file: File | null;
  busy: boolean;
  error: string | null;
  result: ImportResult | null;
  setFile: (f: File | null) => void;
  submit: () => Promise<void>;
  reset: () => void;
};

const UploadCtx = createContext<Ctx | null>(null);

export const useUpload = () => {
  const ctx = useContext(UploadCtx);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
};

export default function UploadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please use true format file");
      return;
    }

    try {
      setBusy(true);

      const form = new FormData();
      form.append("file", file);
      form.append("createdBy", "org-admin");

      const importResult = await createImport(form);
      setResult(importResult);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <UploadCtx.Provider value={{ file, busy, error, result, setFile, submit, reset }}>
      {children}
    </UploadCtx.Provider>
  );
}
