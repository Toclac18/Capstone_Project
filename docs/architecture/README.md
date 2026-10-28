# Kiến trúc hệ thống — Capstone Project

Tài liệu refactor **mức global**: ranh giới module, hợp đồng API, cấu trúc thư mục và guardrail.
Refactor chi tiết từng luồng nghiệp vụ làm **sau**, dựa trên nền này.

| | Tài liệu | Nội dung |
|---|---|---|
| 01 | [Đánh giá hiện trạng](01-assessment.md) | Số liệu đo thực tế, vấn đề phân theo P0/P1/P2 |
| 02 | [Kiến trúc đích](02-target-architecture.md) | Cấu trúc BE/FE/AI, luật phụ thuộc, hợp đồng API |
| 03 | [Lộ trình](03-roadmap.md) | 6 phase, ước lượng công sức, thứ tự ưu tiên |
| 04 | [Quy ước & Guardrail](04-conventions.md) | Naming, ArchUnit, ESLint boundaries, sơ đồ dời file |

---

## Tóm tắt

**Hiện trạng:** monorepo 3 phần — `be` (Spring, 41k LOC), `fe` (Next.js, 85k LOC), `ai` (FastAPI, 3.7k LOC). Cấu trúc đúng chuẩn cho ứng dụng nhỏ, và đã phục vụ tốt tới quy mô này.

**Ba điểm gãy, đều mang tính toàn cục:**

1. **Không có ranh giới.** BE đóng gói phẳng theo tầng (36 controller, 39 service, 35 repository cùng cấp); FE phẳng theo kiểu file. Không nơi nào nói được "feature X gồm những gì" hay "ai được gọi ai".
2. **Không có hợp đồng đơn nhất.** BE trả 3 hình dạng response khác nhau; FE chép tay 37 file type; 303 chỗ `any` dù `strict: true`.
3. **Không có lưới an toàn.** Không migration DB (prod chạy `ddl-auto=update`), không test (chỉ `ExampleTest.java`), CI chỉ build.

**Việc cần làm ngay** (xem [Phase 0](03-roadmap.md#phase-0--vá-p0-ưu-tiên-tuyệt-đối)) — đây là lỗi production, không phải nợ kỹ thuật:

- Production chạy `ddl-auto=update`, không có Flyway, DDL viết tay trong Java.
- `DocumentStatusFixer` / `ReviewRequestStatusFixer` gắn `@Profile("!test")` → chạy `UPDATE` trên dữ liệu thật mỗi lần khởi động prod, dù javadoc gọi chúng là "one-time migration".
- Webhook AI `permitAll()`, không chữ ký — đổi được trạng thái kiểm duyệt document.
- `/dev/**` mở public trong `SecurityConfig`.
- `DEFAULT_BE_BASE` mặc định cổng `8081`, BE chạy `8080`.

Ba mục khác từng bị xếp P0 nhưng kiểm lại thì **không phải lỗi**: cookie name lệch (FE tự set và tự đọc qua cùng một hằng số), `NEXT_PUBLIC_API_BASE_URL` rò vào bundle client (đã `next build` rồi grep: 0 file), và "thiếu `middleware.ts`" (Next.js 16 đổi tên thành `proxy.ts`; file đã có, đã biên dịch, đang chạy — thêm `middleware.ts` sẽ làm vỡ build). Chi tiết trong [01-assessment.md](01-assessment.md).

**Đòn bẩy lớn nhất:** 108/138 BFF route của FE là proxy thuần, 8.238 LOC lặp lại cùng một việc — gộp được về ~250 LOC bằng một bảng route khai báo. Xóa luôn cả một lớp vấn đề: 21 route đang thiếu auth header, 19 route thiếu error boundary.

**Công sức:** ≈ 20 người-ngày, tương đương 3–4 tuần lịch cho 4 người làm xen kẽ phát triển tính năng. Chỉ Phase 3 (dời thư mục) cần đóng băng nhánh, đúng 1 ngày.
