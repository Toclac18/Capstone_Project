import { describe, expect, it } from "vitest";

import { matchRoute, resolveBePath } from "@/server/bff";
import { ROUTES } from "@/server/route-map";
import { HTTP_METHODS } from "@/server/route-types";

function resolve(fePath: string) {
  const m = matchRoute(fePath);
  if (!m) return null;
  return { fe: m.spec.fe, be: resolveBePath(m, fePath), spec: m.spec };
}

describe("bảng route", () => {
  it("không có fe pattern trùng nhau", () => {
    const seen = new Set<string>();
    const dup: string[] = [];
    for (const r of ROUTES) {
      if (seen.has(r.fe)) dup.push(r.fe);
      seen.add(r.fe);
    }
    expect(dup).toEqual([]);
  });

  it("mọi :param trong be đều có trong fe", () => {
    const bad: string[] = [];
    for (const r of ROUTES) {
      const feParams = new Set(
        r.fe.split("/").filter((s) => s.startsWith(":")).map((s) => s.slice(1)),
      );
      for (const seg of r.be.split("/")) {
        if (seg.startsWith(":") && !feParams.has(seg.slice(1))) {
          bad.push(`${r.fe} -> ${r.be} (thiếu ${seg})`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("chỉ dùng method hợp lệ, và không rỗng", () => {
    for (const r of ROUTES) {
      expect(r.methods.length, r.fe).toBeGreaterThan(0);
      for (const m of r.methods) expect(HTTP_METHODS).toContain(m);
    }
  });

  it("không có fe/be bắt đầu bằng dấu /", () => {
    for (const r of ROUTES) {
      expect(r.fe.startsWith("/"), r.fe).toBe(false);
      expect(r.be.startsWith("/"), r.be).toBe(false);
    }
  });

  it("mọi route trong bảng đều tự khớp lại được chính nó", () => {
    const unmatched: string[] = [];
    for (const r of ROUTES) {
      // thay :param bằng giá trị mẫu để dựng một đường dẫn cụ thể
      const concrete = r.fe
        .split("/")
        .map((s) => (s.startsWith(":") ? "sample-id" : s))
        .join("/");
      const hit = matchRoute(concrete);
      if (!hit || hit.spec.fe !== r.fe) {
        unmatched.push(`${r.fe} -> khớp vào ${hit ? hit.spec.fe : "null"}`);
      }
    }
    expect(unmatched).toEqual([]);
  });
});

describe("matcher", () => {
  it("route tĩnh thắng route động cùng độ sâu", () => {
    // policies/active và policies/:id cùng tồn tại trong bảng
    expect(resolve("policies/active")?.fe).toBe("policies/active");
    expect(resolve("policies/abc-123")?.fe).toBe("policies/:id");
  });

  it("thay tham số vào đúng vị trí của mẫu BE", () => {
    // FE đặt theo vai trò, BE theo tài nguyên — đây là lý do bảng route tồn tại
    const r = resolve("business-admin/types/t-42");
    expect(r?.be).toBe("admin/doc-types/t-42");
  });

  it("đường dẫn FE và BE khác nhau hoàn toàn vẫn map đúng", () => {
    expect(resolve("business-admin/tickets")?.be).toBe("contact-tickets");
    expect(resolve("contact-admin")?.be).toBe("contact-tickets");
  });

  it("đổi tên tham số giữa FE và BE vẫn đúng", () => {
    // FE dùng :id, BE template cũ dùng ${documentId}
    const r = resolve("reader/documents/doc-9/violations");
    expect(r?.be).toBe("documents/doc-9/violations");
  });

  it("nhiều tham số trên một đường dẫn", () => {
    const r = resolve("save-lists/L1/documents/D2");
    expect(r?.be).toBe("save-lists/L1/documents/D2");
  });

  it("encode ký tự đặc biệt trong tham số", () => {
    const r = resolve("system-admin/configs/a b&c");
    expect(r?.be).toBe("system-admin/configs/a%20b%26c");
  });

  it("một :param không vượt qua dấu /", () => {
    // policies/:id không được bắt policies/a/b
    const hit = matchRoute("policies/a/b");
    expect(hit?.spec.fe).not.toBe("policies/:id");
  });

  it("đường dẫn không có trong bảng trả null", () => {
    expect(matchRoute("khong/ton/tai/dau")).toBeNull();
  });

  it("bỏ qua dấu / ở đầu và cuối", () => {
    expect(matchRoute("/policies/active/")?.spec.fe).toBe("policies/active");
  });

  it("endpoint public được đánh dấu đúng", () => {
    expect(resolve("policies/active")?.spec.public).toBe(true);
    expect(resolve("homepage/trending-documents")?.spec.public).toBe(true);
    // endpoint cần đăng nhập thì không
    expect(resolve("save-lists/L1")?.spec.public).toBeUndefined();
  });

  it("auth/login KHÔNG nằm trong bảng — route đó set cookie, phải giữ file riêng", () => {
    expect(matchRoute("auth/login")).toBeNull();
    expect(matchRoute("auth/logout")).toBeNull();
  });
});
