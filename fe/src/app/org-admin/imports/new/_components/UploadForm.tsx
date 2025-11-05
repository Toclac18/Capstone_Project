"use client";
import React from "react";
import s from "../styles.module.css";
import { useUpload } from "../provider";

export default function UploadForm() {
  const { file, setFile, busy, error, submit } = useUpload();

  return (
    <form onSubmit={(e)=>{ e.preventDefault(); submit(); }} className="space-y-3">
      <input className={s.input} type="file" accept=".xlsx,.xls" onChange={(e)=> setFile(e.target.files?.[0] ?? null)} />
      {error && <div className={s.error}>{error}</div>}
      <div className="flex gap-2">
        <button disabled={!file || busy} className={s.btnPrimary} type="submit">{busy ? 'Uploading…' : 'Upload & Import'}</button>
      </div>
    </form>
  );
}
