import { describe, expect, it } from "vitest";

import {
  DOCX_MIME,
  MAX_FILE_SIZE_BYTES,
  PDF_MIME,
  fileTypeLabel,
  formatFileSize,
  previewKindFor,
  rejectFile,
  titleFromFileName,
} from "./documentFile";

function fakeFile(type: string, size: number, name = "doc"): File {
  // Không dựng nội dung thật: chỉ cần `type` và `size`, nên ghi đè size cho
  // khỏi phải cấp phát 10MB trong test.
  const file = new File([""], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("rejectFile", () => {
  it("nhận PDF và DOCX trong giới hạn", () => {
    expect(rejectFile(fakeFile(PDF_MIME, 1024))).toBeNull();
    expect(rejectFile(fakeFile(DOCX_MIME, 1024))).toBeNull();
  });

  it("từ chối định dạng khác", () => {
    for (const type of ["text/plain", "image/png", "application/msword", ""]) {
      expect(rejectFile(fakeFile(type, 1024))?.reason).toBe("type");
    }
  });

  it("DOC cũ bị từ chối dù có nhãn hiển thị", () => {
    // fileTypeLabel biết "DOC", nhưng upload thì không nhận — hai việc khác nhau.
    expect(fileTypeLabel("application/msword")).toBe("DOC");
    expect(rejectFile(fakeFile("application/msword", 1024))?.reason).toBe("type");
  });

  it("đúng sát giới hạn vẫn nhận", () => {
    expect(rejectFile(fakeFile(PDF_MIME, MAX_FILE_SIZE_BYTES))).toBeNull();
  });

  it("vượt giới hạn 1 byte là từ chối", () => {
    const rejection = rejectFile(fakeFile(PDF_MIME, MAX_FILE_SIZE_BYTES + 1));
    expect(rejection?.reason).toBe("size");
    expect(rejection?.message).toContain("10MB");
  });

  it("kiểm định dạng trước kích thước", () => {
    // File sai cả hai: báo lý do định dạng, không báo kích thước.
    const rejection = rejectFile(fakeFile("image/png", MAX_FILE_SIZE_BYTES * 2));
    expect(rejection?.reason).toBe("type");
  });

  it("giới hạn khớp 10MB của AI service và BE", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("previewKindFor", () => {
  it("PDF xem bằng react-pdf, DOCX bằng mammoth, còn lại không xem được", () => {
    expect(previewKindFor(PDF_MIME)).toBe("pdf");
    expect(previewKindFor(DOCX_MIME)).toBe("docx");
    expect(previewKindFor("application/msword")).toBe("none");
    expect(previewKindFor("text/plain")).toBe("none");
  });
});

describe("titleFromFileName", () => {
  it("bỏ phần mở rộng", () => {
    expect(titleFromFileName("bao-cao.pdf")).toBe("bao-cao");
    expect(titleFromFileName("de.tai.v2.docx")).toBe("de.tai.v2");
  });

  it("tên không có phần mở rộng thì giữ nguyên", () => {
    expect(titleFromFileName("README")).toBe("README");
  });

  it("giữ dấu tiếng Việt", () => {
    expect(titleFromFileName("Báo cáo tổng kết.pdf")).toBe("Báo cáo tổng kết");
  });
});

describe("formatFileSize", () => {
  it.each([
    [0, "0 Bytes"],
    [512, "512 Bytes"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [10 * 1024 * 1024, "10 MB"],
  ])("%i byte -> %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});
