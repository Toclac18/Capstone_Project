/**
 * Kiểm tra và mô tả file tài liệu được chọn để upload.
 *
 * Tách ra khỏi page.tsx vì `handleFileChange` (chọn qua input) và `handleDrop`
 * (kéo thả) trước đây là hai bản chép Y HỆT nhau. Đã đối chiếu: sau khi chuẩn
 * hoá tên biến cục bộ, hai hàm khác nhau đúng 4 dòng đầu — cách lấy file ra —
 * còn 85 dòng sau trùng từng ký tự: cùng mảng MIME, cùng mốc 10MB, cùng cách
 * dựng blob preview, cùng nhánh mammoth cho DOCX, cùng 10 lệnh setState.
 *
 * Module này không import React nên test được trực tiếp.
 */

export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const ALLOWED_MIME_TYPES = [PDF_MIME, DOCX_MIME] as const;

/** Giữ khớp với giới hạn phía AI service (MAX_UPLOAD_BYTES) và BE. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type FileRejection =
  | { reason: "type"; message: string }
  | { reason: "size"; message: string };

const REJECTION_MESSAGES = {
  type: "Please upload a PDF or DOCX document only",
  size: "File size must be less than 10MB",
} as const;

/**
 * `null` nếu file dùng được, ngược lại là lý do từ chối.
 */
export function rejectFile(file: File): FileRejection | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { reason: "type", message: REJECTION_MESSAGES.type };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { reason: "size", message: REJECTION_MESSAGES.size };
  }
  return null;
}

/** Tên hiển thị của định dạng, dùng ở thẻ thông tin file. */
export function fileTypeLabel(type: string): string {
  if (type === PDF_MIME) return "PDF";
  if (type === "application/msword") return "DOC";
  if (type === DOCX_MIME) return "DOCX";
  return type;
}

/** "1.5 MB" — dùng ở thẻ thông tin file. */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/** Tên file bỏ phần mở rộng — dùng để điền sẵn tiêu đề. */
export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

/** Cách xem trước ứng với định dạng file. */
export type PreviewKind = "pdf" | "docx" | "none";

export function previewKindFor(type: string): PreviewKind {
  if (type === PDF_MIME) return "pdf";
  if (type === DOCX_MIME) return "docx";
  return "none";
}
