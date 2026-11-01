import { describe, expect, it } from "vitest";

import {
  currentRequestFor,
  indexRequestsByDocument,
  pendingRequestFor,
  type IndexableRequest,
} from "./reviewRequestIndex";

function req(
  documentId: string | number | null,
  status: string,
  createdAt: string,
): IndexableRequest & { label: string } {
  return {
    status,
    createdAt,
    document: documentId === null ? null : { id: documentId },
    label: `${documentId}/${status}/${createdAt}`,
  };
}

describe("indexRequestsByDocument", () => {
  it("danh sách rỗng hoặc null cho chỉ mục rỗng", () => {
    expect(indexRequestsByDocument([]).size).toBe(0);
    expect(indexRequestsByDocument(null).size).toBe(0);
    expect(indexRequestsByDocument(undefined).size).toBe(0);
  });

  it("nhóm theo documentId", () => {
    const index = indexRequestsByDocument([
      req("d1", "PENDING", "2026-01-01"),
      req("d2", "PENDING", "2026-01-01"),
      req("d1", "REJECTED", "2026-01-02"),
    ]);
    expect(index.get("d1")).toHaveLength(2);
    expect(index.get("d2")).toHaveLength(1);
  });

  it("mỗi nhóm sắp mới nhất trước", () => {
    const index = indexRequestsByDocument([
      req("d1", "REJECTED", "2026-01-01"),
      req("d1", "REJECTED", "2026-03-01"),
      req("d1", "REJECTED", "2026-02-01"),
    ]);
    expect(index.get("d1")!.map((r) => r.createdAt)).toEqual([
      "2026-03-01",
      "2026-02-01",
      "2026-01-01",
    ]);
  });

  it("id dạng số và dạng chuỗi coi là cùng một tài liệu", () => {
    // Bản cũ so sánh qua String() ở cả hai phía; giữ nguyên tính chất đó.
    const index = indexRequestsByDocument([
      req(7, "PENDING", "2026-01-01"),
      req("7", "ACCEPTED", "2026-01-02"),
    ]);
    expect(index.get("7")).toHaveLength(2);
  });

  it("bỏ qua request không gắn tài liệu", () => {
    const index = indexRequestsByDocument([
      req(null, "PENDING", "2026-01-01"),
      req("", "PENDING", "2026-01-01"),
      req("d1", "PENDING", "2026-01-01"),
    ]);
    expect([...index.keys()]).toEqual(["d1"]);
  });
});

describe("currentRequestFor", () => {
  it("tài liệu không có request nào", () => {
    expect(currentRequestFor(indexRequestsByDocument([]), "d1")).toBeNull();
  });

  it("ưu tiên request đang mở, kể cả khi nó cũ hơn", () => {
    // Đây là thứ tự ưu tiên của bản cũ: PENDING/ACCEPTED trước, rồi mới xét
    // ngày. Một request bị từ chối hôm qua không được che request đang chờ.
    const index = indexRequestsByDocument([
      req("d1", "REJECTED", "2026-03-01"),
      req("d1", "PENDING", "2026-01-01"),
    ]);
    expect(currentRequestFor(index, "d1")!.status).toBe("PENDING");
  });

  it("trong các request đang mở thì lấy cái mới nhất", () => {
    const index = indexRequestsByDocument([
      req("d1", "PENDING", "2026-01-01"),
      req("d1", "ACCEPTED", "2026-02-01"),
    ]);
    expect(currentRequestFor(index, "d1")!.createdAt).toBe("2026-02-01");
  });

  it("không có request đang mở thì lấy cái mới nhất bất kể trạng thái", () => {
    const index = indexRequestsByDocument([
      req("d1", "REJECTED", "2026-01-01"),
      req("d1", "EXPIRED", "2026-02-01"),
    ]);
    expect(currentRequestFor(index, "d1")!.createdAt).toBe("2026-02-01");
  });

  it("tra bằng id số cũng ra kết quả", () => {
    const index = indexRequestsByDocument([req(42, "PENDING", "2026-01-01")]);
    expect(currentRequestFor(index, 42)).not.toBeNull();
    expect(currentRequestFor(index, "42")).not.toBeNull();
  });
});

describe("pendingRequestFor", () => {
  it("chỉ trả về PENDING, không nhận ACCEPTED", () => {
    const index = indexRequestsByDocument([
      req("d1", "ACCEPTED", "2026-03-01"),
      req("d1", "PENDING", "2026-01-01"),
    ]);
    expect(pendingRequestFor(index, "d1")!.status).toBe("PENDING");
  });

  it("không có PENDING thì trả null", () => {
    const index = indexRequestsByDocument([
      req("d1", "ACCEPTED", "2026-01-01"),
      req("d1", "REJECTED", "2026-02-01"),
    ]);
    expect(pendingRequestFor(index, "d1")).toBeNull();
  });

  it("nhiều PENDING thì lấy cái mới nhất", () => {
    const index = indexRequestsByDocument([
      req("d1", "PENDING", "2026-01-01"),
      req("d1", "PENDING", "2026-05-01"),
      req("d1", "PENDING", "2026-03-01"),
    ]);
    expect(pendingRequestFor(index, "d1")!.createdAt).toBe("2026-05-01");
  });

  it("tài liệu không có trong chỉ mục", () => {
    expect(pendingRequestFor(indexRequestsByDocument([]), "d9")).toBeNull();
  });
});

describe("tra cứu không phụ thuộc số lượng request", () => {
  it("10.000 request vẫn tra được O(1) sau khi dựng chỉ mục", () => {
    const requests = Array.from({ length: 10_000 }, (_, i) =>
      req(`doc-${i % 500}`, i % 3 === 0 ? "PENDING" : "REJECTED", `2026-01-01`),
    );
    const index = indexRequestsByDocument(requests);

    expect(index.size).toBe(500);
    // 500 lần tra: bản cũ là 500 x 10.000 phép so sánh.
    for (let i = 0; i < 500; i++) {
      expect(currentRequestFor(index, `doc-${i}`)).not.toBeNull();
    }
  });
});
