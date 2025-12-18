"use client";
import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useUpload } from "../provider";
import ImportResult from "./ImportResult";
import s from "../styles.module.css";

export default function UploadForm() {
  const { file, setFile, busy, error, result, submit } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Show result if available
  if (result) {
    return <ImportResult />;
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className={s.uploadCard}>
        <h2 className={s.uploadTitle}>Upload Excel File</h2>
        
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!file ? (
          <div
            className={`${s.dropzone} ${isDragging ? s.dropzoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className={s.dropzoneIcon}>
              <Upload size={28} />
            </div>
            <div className={s.dropzoneTitle}>Drop your file here</div>
            <div className={s.dropzoneText}>
              or <span className={s.dropzoneBrowse}>browse</span> to choose a file
            </div>
            <div className={s.dropzoneFormats}>Supported formats: .xlsx, .xls</div>
          </div>
        ) : (
          <div className={s.selectedFile}>
            <div className={s.selectedFileIcon}>XLS</div>
            <div className={s.selectedFileInfo}>
              <div className={s.selectedFileName}>{file.name}</div>
              <div className={s.selectedFileSize}>{formatFileSize(file.size)}</div>
            </div>
            <button
              type="button"
              className={s.selectedFileRemove}
              onClick={() => setFile(null)}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {error && <div className={s.error}>{error}</div>}

        <div className={s.formActions}>
          <button
            disabled={!file || busy}
            className={s.btnPrimary}
            type="submit"
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload & Import
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
