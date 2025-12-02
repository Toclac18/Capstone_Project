// src/app/org-admin/imports/provider/index.tsx
"use client";
import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { createImport } from "@/services/org-admin-imports.service";

type Ctx = {
  file: File | null;
  busy: boolean;
  error: string | null;
  setFile: (f: File | null) => void;
  submit: () => Promise<void>;
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
  const router = useRouter();

  const submit = async () => {
    setError(null);
    if (!file) {
      setError("Please use true format file");
      return;
    }
    try {
      setBusy(true);
      const form = new FormData();
      form.append("file", file);
      form.append("createdBy", "org-admin");
      const job = await createImport(form);
      if (job?.id) {
        router.push(`/org-admin/imports/${job.id}`);
      }
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <UploadCtx.Provider value={{ file, busy, error, setFile, submit }}>
      {children}
    </UploadCtx.Provider>
  );
}
