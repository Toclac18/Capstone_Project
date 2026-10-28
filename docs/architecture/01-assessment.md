# 01 — Đánh giá kiến trúc hiện trạng

> Quét ngày 2026-10-28, branch `dev` @ `77a3a71`.
> Mọi số liệu dưới đây đo trực tiếp từ source, không ước lượng.

## 1. Bản đồ hệ thống

```
Capstone_Project/
├── be/   Spring Boot 3.3.3 · Java 21 · Gradle   430 file · 41.401 LOC
├── fe/   Next.js 16 · React 19 · TS strict      626 file · 85.528 LOC
├── ai/   FastAPI · Python (2 service rời)        18 file ·  3.747 LOC
└── .github/workflows/ci.yml                     build-only, không test/lint
```

Runtime: `FE (Next SSR + BFF) → BE (Spring) → Postgres`, nhánh phụ `BE → AI (HTTP) → BE (webhook)`.

### Phân bố khối lượng

| BE layer    | file | LOC    | | FE layer        | LOC    |
|-------------|-----:|-------:|-|-----------------|-------:|
| service     |   78 | 18.567 | | app/** (.tsx)   | 46.448 |
| controller  |   36 |  5.855 | | app/api (BFF)   | 13.344 |
| dto         |  128 |  5.574 | | mock            |  8.264 |
| config      |   35 |  3.433 | | components      |  7.952 |
| repository  |   49 |  2.836 | | services        |  4.627 |
| domain      |   59 |  2.353 | | types/utils/... |  4.893 |

---

## 2. Vấn đề theo mức độ ưu tiên

Ký hiệu: **P0** = rủi ro production, sửa ngay · **P1** = chặn khả năng refactor chi tiết · **P2** = nợ kỹ thuật tích lũy.

### P0 — Rủi ro production

**P0-1. Không có công cụ migration DB. Production đang chạy `ddl-auto=update`.**
- `be/render.yaml:60` → `JPA_DDL_AUTO=update`; `application.yml:22` mặc định cũng `update`.
- Không có Flyway/Liquibase (đã grep toàn bộ `build.gradle` + `application.yml`).
- Thay thế bằng DDL viết tay trong Java: `config/migration/AiProcessingJobTableMigration.java` chạy `CREATE TABLE` qua `JdbcTemplate` ở `ApplicationReadyEvent`.
- **Hệ quả:** schema prod do Hibernate suy ra, không ai kiểm soát; `update` không bao giờ drop/sửa cột ⇒ schema trôi dần khỏi entity; không rollback được; không tái tạo được môi trường.

**P0-2. Hai "fixer" ghi đè dữ liệu thật mỗi lần khởi động prod.**
- `DocumentStatusFixer.java`, `ReviewRequestStatusFixer.java` gắn `@Profile("!test")` ⇒ bật ở **mọi** profile trừ test, prod bao gồm.
- Mỗi lần app khởi động chúng chạy `UPDATE document SET status='PENDING_REVIEW' WHERE status IN ('VERIFIED','AI_VERIFIED')` và `UPDATE review_request SET status='ACCEPTED' WHERE status='COMPLETED'` — không điều kiện gì khác.
- Javadoc tự gọi mình là *"one-time migration"* nhưng không có cơ chế nào đảm bảo chạy một lần.
- Cả hai `catch (Exception)` rồi chỉ log ⇒ thất bại âm thầm.
- 16 seeder còn lại có `@Profile("dev")` đúng.

**P0-3. Webhook AI không xác thực.**
- `SecurityConfig.java` → `/v1/ai/webhook` nằm trong `permitAll()`.
- `AiWebhookController` tự thừa nhận trong comment: *"Consider adding IP whitelist or secret token validation in production"*.
- Endpoint này đổi được `AiProcessingJob.status` và trạng thái kiểm duyệt của `Document`. Bất kỳ ai biết `jobId` đều gọi được.
- Controller này còn inject thẳng 2 repository và đặt `@Transactional` ở tầng controller.

**P0-4. `/dev/**` mở public trong `SecurityConfig`.**

**P0-5. Mặc định `DEFAULT_BE_BASE` trỏ sai cổng.**
`server/config.ts` mặc định `http://localhost:8081`, nhưng BE chạy ở `8080` (`server.port` trong `application.yml`). Chỉ phát tác khi thiếu biến env, nên không gãy ở môi trường đã cấu hình đủ — vẫn là một cái bẫy không có lý do tồn tại.

---

### Ba mục từng xếp P0 nhưng kiểm lại thì không phải

Ghi lại đầy đủ thay vì xoá, để lần sau không ai kết luận lại như vậy.

**Cookie name lệch giữa code và deploy — KHÔNG phải lỗi.**
`server/config.ts` mặc định `access-token` còn `.env.local` và `render.yaml` dùng `access_token`. Nhưng BE **không đặt cookie nào** (đã grep: không có `ResponseCookie`/`addCookie`/`Set-Cookie` trong toàn bộ BE) — FE tự set ở `app/api/auth/login/route.ts` và tự đọc, **cùng đi qua một hằng số `COOKIE_NAME`**. Set và get vì thế luôn khớp nhau dù giá trị là gì. Vẫn nên thống nhất để tránh bẫy, nhưng không gãy auth.

**`NEXT_PUBLIC_API_BASE_URL` rò vào client bundle — KHÔNG xảy ra.**
Đã chạy `next build` rồi grep `.next/static`: **0 file** chứa giá trị đó. Biến chỉ được tham chiếu từ code server (`server/config.ts`, `next.config.ts`), và Next chỉ nhúng `NEXT_PUBLIC_*` vào bundle nào thực sự tham chiếu nó. Đây là vấn đề **quy ước** — một giá trị server-only mang tiền tố public, nên chỉ cần một import từ client component là rò thật — chứ không phải rò đang xảy ra.

**Không có `middleware.ts` — SAI, chốt bảo vệ route đã có và đang chạy.**
`src/proxy.ts` (76 dòng) là middleware đầy đủ: danh sách path công khai, chuyển hướng về `/auth/sign-in` kèm `?next=`, đẩy người đã đăng nhập khỏi trang auth, và `config.matcher`.

**Next.js 16 đã đổi tên `middleware.ts` thành `proxy.ts`** — `node_modules/next/dist/lib/constants.js` có cả `MIDDLEWARE_FILENAME = 'middleware'` và `PROXY_FILENAME = 'proxy'`, và Next **báo lỗi build nếu tồn tại cả hai file**. Kiểm chứng bằng `next build`:

- build output in `ƒ Proxy (Middleware)`
- `.next/static/<hash>/_clientMiddlewareManifest.json` chứa đúng nguyên văn matcher của `proxy.ts`

⇒ Thêm `middleware.ts` sẽ **làm vỡ build**, không phải sửa lỗi.

---

### P1 — Chặn khả năng refactor chi tiết

**P1-1. FE: 138 route handler viết tay, 13.344 LOC, lặp cùng một việc.**

Phân loại 138 file:

| Loại | Số file | LOC | Xử lý |
|---|---:|---:|---|
| **A** — passthrough hoàn toàn | **24** | **1.449** | Gộp về 1 handler + 1 bảng route |
| **B** — chỉ khác hình dạng response lỗi | **17** | **1.244** | Gộp, hành vi lỗi đổi (có chủ đích) |
| **C** — parse rồi trả lại nguyên body | **31** | **2.239** | Gộp, khác biệt cosmetic |
| Khác thật (transform, formdata, stream, side effect) | 66 | 8.419 | Giữ file riêng |

> **Bản rà soát đầu tiên ghi "108 proxy thuần / 8.238 LOC" — con số đó đếm quá.**
> Nó dựa trên một phép lọc lỏng (không `.map`/`.filter`/`.reduce`, không formdata,
> không stream) và bỏ sót các route định hình lại response bằng cách khác.
> Bảng trên dùng tiêu chí chặt hơn: *proxy thuần không bao giờ cần đọc body hay
> status của upstream*. Thực tế gộp được **72 route / 4.920 LOC**.

Mức độ *không* đồng nhất giữa 138 file:

| Dùng helper chung | Số file |
|---|---:|
| `BE_BASE` | 137 |
| `fetch()` thô | 135 |
| `withErrorBoundary` | 119 |
| `getAuthHeader` | 117 |
| `proxyJsonResponse` | 86 |

Tức là **52 route không dùng `proxyJsonResponse`**, **21 route không gắn `getAuthHeader`**, **19 route không có error boundary**. Mỗi lỗ hổng là một hành vi khác biệt phải nhớ thủ công.

Đường dẫn FE **không** map 1:1 sang BE (FE đặt theo vai trò, BE theo tài nguyên):

```
/api/business-admin/users        → /api/admin/readers
/api/business-admin/reports      → /api/reports
/api/contact-admin               → /api/contact-tickets
/api/search-meta                 → /api/documents/search-meta
/api/org-admin/documents         → /api/organization/documents
```

⇒ Không thể dùng catch-all đơn thuần; cần **bảng route khai báo**. Đây chính là lý do những file đó tồn tại.

**P1-2. FE: mock đan vào đường chạy production.**
- 8.264 LOC trong `src/mock` (29 file), 61 file import `@/mock`.
- 118/138 route có nhánh `if (USE_MOCK)` — mock là **nhánh runtime**, không phải lớp thay thế lúc build.
- `src/mock/db.mock.ts` một mình đã 2.015 LOC — file lớn nhất toàn FE.

**P1-3. BE: 3 hình dạng response khác nhau cho cùng một API.**

| Kiểu trả về | Số controller method | JSON |
|---|---:|---|
| `ApiResponse<T>` | 30 | `{success, message, data, timestamp}` |
| `PagedResponse<T>` | 39 | `{success, message, data[], pageInfo, timestamp}` |
| `Page<T>` thô | 5 | `{content[], pageable{}, totalElements, ...}` |

Cộng thêm `ResponseWrapperAdvice` tự bọc mọi thứ chưa bọc (và **cố ý bỏ qua** `Page<?>`). FE vì thế phải đoán hình dạng ⇒ 98 chỗ `any` riêng trong `app/api`, 303 `any` toàn FE dù `strict: true`.

**P1-4. BE: đóng gói theo tầng kỹ thuật, không có ranh giới module.**
`controller/` 36 file, `service/impl/` 39 file, `repository/` 35 file — tất cả nằm phẳng cùng cấp. Hệ quả: bất kỳ service nào cũng inject được bất kỳ repository nào; không có khái niệm "sở hữu dữ liệu"; không công cụ nào chặn được coupling mới.

**P1-5. BE: God Service.**

| Service | LOC | Dependency |
|---|---:|---:|
| `DocumentServiceImpl` | 1.811 | **26** |
| `BusinessAdminStatisticsServiceImpl` | 1.429 | 12 |
| `ReviewRequestServiceImpl` | 1.291 | 13 |
| `EmailServiceImpl` | 1.275 | — |
| `UserServiceImpl` | 1.095 | 14 |

`DocumentServiceImpl` giữ 16 repository + 8 service + 1 mapper, gánh: CRUD, upload, phân quyền đọc, thumbnail, chuyển đổi định dạng, kiểm duyệt AI, điểm thưởng, thông báo, email, báo cáo vi phạm, lịch sử đọc. Không tách được theo luồng khi 26 phụ thuộc nằm chung một constructor.

**P1-6. FE: code của một feature nằm rải 4–5 nơi.**
Ví dụ feature *document*: `app/reader/upload-document/` + `app/api/documents/**` + `services/document.service.ts` + `types/document.ts` + `components/ModalPreview/`. Không có đơn vị "feature" nào để một người nhận và refactor trọn vẹn.

**P1-7. BE không có test.** `src/test` chỉ chứa `ExampleTest.java`. 41k LOC không lưới an toàn ⇒ refactor chi tiết sau này không kiểm chứng được.

---

### P2 — Nợ kỹ thuật

**P2-1. Thư mục trùng mục đích:** `repository/spec/` (1 file) và `repository/specification/` (13 file).

**P2-2. Hai file seeder chết:** `OrganizationSeeder.java` (99 dòng) và `ReaderSeeder.java` (100 dòng) bị comment **toàn bộ** — 0 dòng code thật, không còn `@Component`. Chúng không phải Spring bean và không chạy ở đâu cả; chỉ là 199 dòng nhiễu. Xoá.

> Bản rà soát đầu tiên xếp hai file này vào P0 với kết luận "chạy nhầm prod". Sai: lúc đó chỉ grep thấy dòng `//@Profile("dev")` và suy ra annotation bị comment trong khi class vẫn sống. Thực tế cả file bị comment. Đã kiểm lại từng dòng.

**P2-3. `config/` là ngăn kéo tạp:** `GlobalExceptionHandler` (419 LOC), `ResponseWrapperAdvice`, `LogRetentionJob`, `seed/` (17 file), `migration/`, `filter/`, `constant/`, `annotation/` — lẫn hạ tầng, cross-cutting và dữ liệu mẫu.

**P2-4. Bảo mật tách đôi:** `security/` và `config/filter/` + `config/annotation/` cùng lo một việc ở hai gốc khác nhau.

**P2-5. Role là chuỗi ma thuật:** 141 annotation `@PreAuthorize` viết tay `hasRole('BUSINESS_ADMIN')`… trong khi enum `UserRole` đã tồn tại. Gõ sai tên role ⇒ không lỗi biên dịch, chỉ lặng lẽ từ chối truy cập.

**P2-6. 4 controller không có `@PreAuthorize` nào:** `AiWebhookController`, `AuthController`, `PublicDomainController`, `UserController`.
Đã kiểm từng cái: `UserController` chỉ có endpoint self-service (đổi mật khẩu/email của chính mình, xóa tài khoản của chính mình) và lấy user hiện tại qua `@AuthenticationPrincipal` — **không phải lỗi**, không cần role check. `AuthController` và `PublicDomainController` là public có chủ đích. Chỉ `AiWebhookController` là vấn đề thật, đã nêu ở **P0-3**.

**P2-7. Rò tầng:** 3/36 controller import entity trực tiếp (`DocTypeController`, `TagController`, `AiWebhookController`); 3 controller inject repository (`AiWebhookController`, `SystemAdminController`, `StatisticsController`).

**P2-8. Còn 3.236 LOC code template (50 file)** ở `app/(template)` + `components/(template)` — **26 page thật đang import vào**, nên không xóa thẳng được, phải tách phần đang dùng ra trước.

**P2-9. 6 component hộp thoại chồng chức năng:** `AlertDialog`, `ConfirmModal`, `ModalPreview`, `ui/delete-confirmation`, `ui/edit-confirmation`, `ui/status-confirmation`, `ui/change-role-modal`. Kèm 3 file `*_GUIDE.md` nằm lẫn trong `components/ui/`.

**P2-10. Quy ước đặt tên không nhất quán:**
- services: `policyService.ts`, `roleManagementService.ts`, `systemLogService.ts`, `charts.services.ts` lẫn với 33 file `*.service.ts`.
- component dir: `AlertDialog/` (Pascal) lẫn `ui/`, `layouts/` (kebab).
- page components: 42 thư mục `_components/`, 1 thư mục `components/`.

**P2-11. Component quá lớn:** **58 component React vượt 300 LOC**, 12 `page.tsx` vượt 150 LOC. Lớn nhất: `upload-document/page.tsx` 1.270, `Signup.tsx` 1.060, `ReviewManagement.tsx` 1.002, `EditDocumentModal.tsx` 760, `profile/page.tsx` 760.

**P2-12. AI service đứng ngoài hệ thống:**
- Hàng đợi **trong bộ nhớ** (`asyncio.Queue` + `Dict[str, Job]`, 1 worker tuần tự) ⇒ restart là mất sạch job đang chạy, BE treo chờ webhook không bao giờ tới.
- `document_router.py` 1.055 LOC — toàn bộ API trong một file.
- Không Dockerfile, không nằm trong `render.yaml`, không nằm trong CI, không lock dependency, không test.
- `test6.pdf` (169 KB) commit ở thư mục gốc `ai/`.

**P2-13. CI có cổng nhưng không chặn được gì.**

Đã đọc lại `.github/workflows/ci.yml` từng dòng. Những gì CI **đã làm**:

| | |
|---|---|
| BE | `./gradlew build` — **có** chạy test |
| FE | `npm run lint`, rồi `npm run build` — `next build` **có** typecheck |
| | `dorny/paths-filter` để job chỉ chạy khi phần tương ứng đổi |

Khoảng trống thật là ba chỗ:

1. **Trigger `push` bị comment** ⇒ code merge thẳng vào `dev` không được kiểm gì. Chỉ PR mới chạy CI.
2. **`npm run lint` không có ngân sách warning** ⇒ nó pass dù có bao nhiêu warning cũng được, nên nợ lint tăng mà không ai thấy.
3. **`ai/` bị bỏ ngoài hoàn toàn** — không có job nào chạm tới.

Cộng thêm: fail test không để lại báo cáo, nên log CI chỉ nói "test failed" mà không nói test nào.

> Và một điểm cần nói rõ: `./gradlew build` **có** cổng test, nhưng `src/test` chỉ chứa `ExampleTest.java` (xem **P1-7**) nên cổng đó không kiểm gì cả. Cổng tồn tại mà rỗng thì khác với không có cổng — sửa cách khác nhau: cái trước cần viết test, cái sau cần sửa workflow.
>
> Bản rà soát đầu tiên viết "không chạy test, không chạy `npm run lint`" — **sai cả hai**. Lúc đó tôi suy từ việc không thấy test nào mà không đọc hết workflow.

**P2-14. Không có shared contract:** springdoc đã bật nhưng OpenAPI spec không được dùng để sinh type FE ⇒ 37 file trong `src/types` chép tay từ DTO backend, trôi dạt âm thầm.

---

## 3. Kết luận

Cấu trúc hiện tại **đúng sách giáo khoa cho một ứng dụng nhỏ** và đã phục vụ tốt tới quy mô này. Nó gãy ở ba điểm, đều mang tính toàn cục:

1. **Không có ranh giới** — BE phẳng theo tầng, FE phẳng theo kiểu file. Không nơi nào trong repo nói được "feature X gồm những gì" hay "ai được gọi ai".
2. **Không có hợp đồng đơn nhất** — 3 hình dạng response, type FE chép tay, 303 `any`. Mỗi lần nối FE-BE là một lần thương lượng lại.
3. **Không có lưới an toàn** — không migration, không guardrail, và CI tuy có cổng test lẫn lint nhưng không chặn được gì: `src/test` gần như rỗng, lint không có ngân sách, trigger `push` bị tắt. Mọi refactor đều là đặt cược.

Ba điểm này phải xử lý **trước** khi refactor từng luồng, đúng như định hướng "hoàn thiện global trước". Nếu refactor chi tiết trước, kết quả sẽ phải làm lại khi ranh giới module thay đổi.

→ Cấu trúc đích: [02-target-architecture.md](02-target-architecture.md)
→ Lộ trình: [03-roadmap.md](03-roadmap.md)
