# 02 — Kiến trúc đích

Mục tiêu: dựng **ranh giới**, **hợp đồng** và **lưới an toàn** ở mức toàn cục, để sau đó mỗi luồng nghiệp vụ refactor được độc lập mà không giẫm chân nhau.

Nguyên tắc chọn kiến trúc:
- **Modular monolith**, không microservice. Team 4 người, 1 DB, deadline capstone — tách service sẽ trả giá vận hành mà không được gì.
- **Đổi chỗ trước, đổi code sau.** Phần lớn việc ở giai đoạn global là *di chuyển* file và *rút* lặp, không viết lại logic.
- **Guardrail thay cho code review.** Ranh giới nào không có công cụ kiểm tra thì sẽ hỏng lại sau 2 sprint.

---

## 1. Backend — package theo feature

### 1.1 Cấu trúc đích

```
com.capstone.be
├── BeApplication.java
│
├── shared/                        ← kernel. KHÔNG phụ thuộc bất kỳ module nào
│   ├── api/                       ApiResponse, PageInfo, @NoWrap, ResponseWrapperAdvice
│   ├── exception/                 BusinessException, ErrorCode, GlobalExceptionHandler
│   ├── persistence/               BaseEntity, JpaConfig, Auditing, PagingUtil
│   ├── security/                  SecurityConfig, JwtUtil, UserPrincipal,
│   │                              @CurrentUser, Roles (hằng số thay chuỗi ma thuật)
│   ├── storage/                   FileStorageService (S3), AwsS3Config
│   ├── mail/                      MailSender — CHỈ hạ tầng gửi, không chứa nội dung nghiệp vụ
│   ├── config/                    AsyncConfig, CacheConfig, OpenApiConfig, RestTemplateConfig
│   └── util/                      StringUtil, ExcelUtil, OtpUtil, HtmlSanitizerUtil
│
├── modules/
│   ├── identity/                  User, Auth, ReaderProfile, ReviewerProfile
│   │   ├── api/                   Controller + dto/request + dto/response   ← public
│   │   ├── domain/                Entity + enum
│   │   ├── repository/
│   │   ├── service/
│   │   └── spi/                   Interface + DTO cho module khác gọi       ← public
│   ├── organization/              OrganizationProfile, OrgEnrollment, member import
│   ├── document/                  Document, upload, access, thumbnail, conversion
│   ├── review/                    ReviewRequest, ReviewResult, reviewer assignment
│   ├── moderation/                AI integration, AiProcessingJob, webhook
│   ├── engagement/                Comment, Vote, SavedList, ReadHistory, Redemption
│   ├── notification/              Notification, SSE, NotificationHelper
│   ├── catalog/                   Tag, DocType, Domain, Specialization
│   ├── support/                   ContactTicket, DocumentReport, DocumentViolation
│   ├── statistics/                4 service thống kê hiện tại
│   └── administration/            SystemConfig, Policy, SystemLog, audit
│
└── bootstrap/
    ├── seed/                      17 seeder — @Profile("dev") BẮT BUỘC
    └── DataInitializer.java
```

### 1.2 Luật phụ thuộc (ép bằng ArchUnit)

```
module.api        → module.service, module.domain          (cùng module)
module.service    → module.repository, module.domain, shared.**, <other>.spi
module.repository → module.domain, shared.persistence
module.spi        → chỉ kiểu dữ liệu riêng của nó (không entity)
shared.**         → KHÔNG BAO GIỜ import modules.**
```

Ba luật quan trọng nhất:

1. **Module A không được import `B.repository` hay `B.service`.** Muốn dùng B thì qua `B.spi`.
2. **Controller không được import `*.repository`.** (Hiện có 3 chỗ vi phạm.)
3. **`shared` không được biết module nào tồn tại.**

> **Về entity dùng chung:** `Document` đang có quan hệ JPA tới `User`, `Tag`, `OrganizationProfile`… Cắt hết thành tham chiếu bằng ID là việc lớn và **không thuộc giai đoạn global**. Giai đoạn này chỉ ép ranh giới `repository` + `service`; cho phép đọc chéo `domain` và đánh dấu bằng ArchUnit ở mức *cảnh báo*. Siết dần khi refactor từng luồng.

### 1.3 Tách God Service

`DocumentServiceImpl` (1.811 LOC / 26 dep) tách theo **động từ nghiệp vụ**, không theo tầng kỹ thuật:

```
modules/document/service/
├── DocumentQueryService        đọc, tìm kiếm, chi tiết          (~6 dep)
├── DocumentCommandService      tạo, sửa, xóa, đổi trạng thái     (~6 dep)
├── DocumentUploadService       upload, thumbnail, convert        (~5 dep)
├── DocumentAccessService       phân quyền đọc, redemption        (đã có)
└── DocumentLifecycleListener   phản ứng sự kiện: thông báo, email, điểm
```

Phần "thông báo + email + cộng điểm" hiện nằm trong thân hàm nghiệp vụ → chuyển sang **Spring `ApplicationEventPublisher`**. Đây là thứ cắt được nhiều dependency nhất: notification, email, statistics không còn là phụ thuộc trực tiếp của document nữa.

```java
// thay vì gọi trực tiếp 3 service trong thân hàm
events.publish(new DocumentApprovedEvent(doc.getId(), doc.getOwnerId()));
```

Áp dụng cùng công thức cho `ReviewRequestServiceImpl` và `UserServiceImpl`.

### 1.4 Hợp đồng API — một hình dạng duy nhất

Bỏ `Page<T>` thô, bỏ lớp `PagedResponse` riêng. Chỉ còn **một** lớp `ApiResponse`
với các field phụ `NON_NULL`, nên response thực tế chỉ chứa phần có ý nghĩa:

```jsonc
// Không phân trang
{ "success": true, "data": { ... }, "timestamp": "..." }

// Có phân trang — data là MẢNG, thông tin trang ở pageInfo cùng cấp
{ "success": true,
  "data": [ ... ],
  "pageInfo": { "page": 0, "size": 20, "totalElements": 134, "totalPages": 7,
                "first": true, "last": false, "hasNext": true, "hasPrevious": false },
  "timestamp": "..." }

// Lỗi — errorCode ổn định từ enum ErrorCode, để FE so khớp thay vì so chuỗi message
{ "success": false, "message": "Document not found",
  "errorCode": "3002", "timestamp": "..." }

// Lỗi validation — thêm fieldErrors
{ "success": false, "message": "Validation failed", "errorCode": "1002",
  "fieldErrors": { "title": "..." }, "timestamp": "..." }
```

> **Vì sao `pageInfo` ở cấp ngoài, không lồng trong `data`.**
> Bản đầu của tài liệu này đề xuất `data: { items, page }`. Khi thực thi thì phương án
> đó bị loại: `pageInfo` đang được đọc ở **46 file** FE, `totalPages` ở **68 file**,
> `totalElements` ở **52 file** — phần lớn là component phân trang, và FE không có test
> nào để đỡ. Lồng thêm một cấp bắt sửa ~70 file UI để đổi lấy một thay đổi thuần hình thức.
>
> Gộp `pageInfo` vào chính `ApiResponse` dưới dạng field optional đạt đúng mục tiêu —
> một lớp duy nhất, FE không còn phải đoán — mà JSON của 39 endpoint phân trang **không
> đổi một ký tự**, nên chúng không làm vỡ gì. Chỉ 5 endpoint `Page<T>` thô là đổi thật.

`errorCode` là **mã số dạng chuỗi** (`"3002"`), lấy từ enum `ErrorCode`; không phải tên
hằng số. Trước đây mã này bị nhét vào `data` dưới dạng `{"errorCode": "..."}`, khiến
`data` mang hai nghĩa khác nhau tuỳ `success`.

`ResponseWrapperAdvice` không còn "tự đoán": nó bọc DTO thô vào `ApiResponse`, và với
`Page<?>` thì bọc qua `ApiResponse.page()` **kèm log cảnh báo** thay vì bỏ qua như trước.
Đây là lưới an toàn lúc chạy; chặn từ gốc là việc của luật ArchUnit
`controllers_never_return_raw_page` (xem [04-conventions.md](04-conventions.md) §3, Phase 5).

### 1.5 Schema DB

| Hiện tại | Đích |
|---|---|
| `ddl-auto: update` ở prod | `ddl-auto: validate` ở prod, `none` ở test |
| DDL viết tay trong `config/migration/*.java` | Flyway `V1__baseline.sql`, `V2__...` |
| Fixer dữ liệu chạy ở prod mỗi lần boot | Chuyển thành migration Flyway; `bootstrap/seed` + `@Profile("dev")` bắt buộc, có ArchUnit kiểm |

Baseline sinh một lần từ schema dev hiện tại (`pg_dump --schema-only`), từ đó mọi thay đổi schema đi qua file migration có review.

### 1.6 Tách profile cấu hình

```
application.yml          chung, không chứa giá trị môi trường
application-dev.yml      ddl-auto=update, show-sql=true, seeder bật
application-prod.yml     ddl-auto=validate, show-sql=false, seeder tắt
application-test.yml     ddl-auto=create-drop, Testcontainers
```

---

## 2. Frontend — feature-based

### 2.1 Cấu trúc đích

```
fe/src/
├── app/                           ← CHỈ routing, layout, page shell
│   ├── (public)/                  homepage, search, docs-view
│   ├── (auth)/                    sign-in, sign-up, forgot-password
│   ├── (reader)/                  library, saved-list, upload, history
│   ├── (reviewer)/
│   ├── (org-admin)/
│   ├── (business-admin)/
│   ├── (system-admin)/
│   └── api/
│       ├── [...path]/route.ts     ← 1 proxy chung thay cho 72 file
│       └── <special>/route.ts     ← 66 route upload/stream/transform giữ riêng
│
├── features/                      ← mỗi feature tự chứa trọn vẹn
│   └── document/
│       ├── api/                   gọi BFF (thay src/services)
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── schema/                zod — dùng chung cho form và validate response
│
├── shared/
│   ├── ui/                        design system: Button, Modal, Table, Toast, Pagination
│   ├── lib/                       http client, auth, env (có validate)
│   ├── hooks/
│   ├── types/api.ts               ← SINH TỪ OpenAPI, không sửa tay
│   └── utils/
│
├── server/                        ← kernel BFF: proxy, auth, response, route-map
└── middleware.ts                  ← chốt bảo vệ route tập trung (hiện chưa có)
```

`page.tsx` chỉ còn: đọc params → gọi `features/*/api` → render component. Không fetch logic, không business logic.

### 2.2 Gộp 72 BFF route về bảng khai báo

Vấn đề đã đo: đường dẫn FE theo **vai trò**, BE theo **tài nguyên** ⇒ không catch-all thẳng được. Giải pháp là một bảng route + một handler:

```ts
// server/route-map.ts
export const ROUTES: RouteMap = {
  "business-admin/users":          { be: "admin/readers",          roles: ["BUSINESS_ADMIN"] },
  "business-admin/users/:id":      { be: "admin/readers/:id",      roles: ["BUSINESS_ADMIN"] },
  "business-admin/reports":        { be: "reports",                roles: ["BUSINESS_ADMIN"] },
  "contact-admin":                 { be: "contact-tickets",        roles: ["BUSINESS_ADMIN"] },
  "search-meta":                   { be: "documents/search-meta",  public: true },
  "org-admin/documents":           { be: "organization/documents", roles: ["ORGANIZATION_ADMIN"] },
  // ...
};
```

```ts
// app/api/[...path]/route.ts  — một file thay cho 72
const handler = (req: NextRequest, ctx: Ctx) => proxy(req, ctx, ROUTES);
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
```

`proxy()` làm **một lần** cho tất cả: resolve route → kiểm role → gắn cookie auth → forward query/body → chuẩn hóa response → error boundary.

**Thu được:** 72 file / 4.920 LOC → 4 file / 344 dòng. Và điều quan trọng hơn con số: 21 route đang thiếu auth header, 19 route thiếu error boundary **biến mất như một lớp vấn đề** — không còn chỗ để quên.

Route nào **không** gộp được: đọc rồi định hình lại body, formdata, stream, đường dẫn BE
dựng từ body request, hoặc có side effect (`auth/login` ghi cookie JWT). 66 route giữ file riêng.

66 route còn lại giữ file riêng — Next.js ưu tiên route cụ thể hơn catch-all nên hai cách sống song song.

> Kernel đặt ở `server/bff.ts`, **không** phải `server/proxy.ts`: `src/proxy.ts` đã là
> middleware của Next.js 16 (xem [01-assessment.md](01-assessment.md)), hai tên cạnh nhau sẽ gây lẫn.

### 2.3 Mock: từ nhánh runtime thành lớp thay thế

```
Hiện tại:  route.ts → if (USE_MOCK) { ...mock... } else { ...fetch BE... }
Đích:      server/backend/index.ts  →  USE_MOCK ? mockBackend : httpBackend
```

Mock lùi về sau một interface duy nhất, nằm ở `src/mocks/` ngoài `src/`, không còn import được từ code production (ép bằng ESLint `no-restricted-imports`). 8.264 LOC mock giữ nguyên giá trị nhưng không còn chen vào đường chạy thật.

### 2.4 Hợp đồng type sinh tự động

```bash
# BE đã bật springdoc, chỉ cần dùng
npx openapi-typescript http://localhost:8080/api/v3/api-docs -o src/shared/types/api.ts
```

Chạy trong CI và fail nếu diff ⇒ BE đổi DTO mà FE chưa cập nhật thì CI đỏ, không phải đợi runtime. Đây là cách duy nhất để 303 chỗ `any` giảm bền vững.

---

## 3. AI service

```
ai/
├── readee-ai/
│   ├── src/readee_ai/
│   │   ├── api/            router tách theo nhóm (thay 1 file 1.055 LOC)
│   │   ├── services/
│   │   ├── workers/
│   │   └── config.py       pydantic-settings, validate lúc khởi động
│   ├── tests/
│   ├── Dockerfile          ← chưa có
│   └── pyproject.toml      ← thay requirements.txt, có lock
├── ocr-service/            cấu trúc tương tự
└── (bỏ test6.pdf khỏi repo)
```

**Hàng đợi:** `asyncio.Queue` trong RAM là điểm gãy thật — restart khi đang xử lý thì job biến mất và BE chờ webhook vĩnh viễn.

Giai đoạn global **chưa** cần Redis/Celery. Đủ và rẻ:
- Bảng `ai_processing_jobs` ở BE **đã là** nguồn sự thật — dùng nó.
- BE thêm scheduler quét job `PROCESSING` quá hạn (ví dụ > 15 phút) → đánh `FAILED` + retry.
- Thêm `GET /jobs/{id}` ở AI để BE chủ động hỏi khi webhook không tới.

⇒ Hệ thống tự phục hồi mà không thêm hạ tầng mới. Chuyển sang hàng đợi bền vững để sau.

**Webhook:** ký HMAC shared-secret, BE kiểm chữ ký trước khi xử lý. Bỏ `/v1/ai/webhook` khỏi `permitAll()`, thay bằng filter riêng.

---

## 4. Guardrail — thứ giữ cho kiến trúc không hỏng lại

| Lớp | Công cụ | Chặn điều gì |
|---|---|---|
| BE | **ArchUnit** (test thường) | **đang chạy:** controller→repository, controller→entity, `@Transactional` ở controller, controller trả `Page<?>`, seeder thiếu `@Profile`, field injection, tầng service/repository/entity. 4 luật đầu dùng `FreezingArchRule` vì còn vi phạm |
| BE | ArchUnit (tiếp) | **cần Phase 3:** import chéo module, `shared`→`modules` |
| FE | `no-restricted-imports` (sẵn có) | `services/`, `types/`, `utils/`, `components/`, `hooks/` không import lên tầng ngoài hay vào `mock/` — **đang chạy** |
| FE | **eslint-plugin-boundaries** | `features/a` → `features/b` bằng capture cùng tên — **cần Phase 3**, trước đó `no-restricted-imports` đủ |
| FE | `no-restricted-imports` | `@/app/(template)` sau khi đã tách |
| Contract | `openapi-typescript` + diff check | FE type lệch DTO backend |
| CI | test + lint + typecheck | tất cả những cái trên, cộng **ngân sách warning** (`--max-warnings`) để nợ lint không tăng |

ArchUnit là lựa chọn chính vì nó là **test JUnit bình thường** — chạy trong `gradle build` sẵn có, không cần thêm hạ tầng, và báo lỗi ngay tại PR.

---

## 5. CI đích

```yaml
jobs:
  backend:   gradle build                      # ArchUnit chạy ở đây            ✓
  frontend:  tsc --noEmit → lint → next build  # lint có --max-warnings         ✓
  ai:        compileall → ruff                 # pytest: chưa có test nào       ◐
  contract:  sinh lại api.ts → git diff --exit-code                            ✗
```

`✓` đã có · `◐` một phần · `✗` chưa làm — xem [03-roadmap.md](03-roadmap.md) Phase 5.

Bật lại trigger `push: [dev]` (hiện đang bị comment), và thêm **ngân sách warning** cho
lint (`--max-warnings <số hiện tại>`) — không có nó thì `npm run lint` pass dù nợ lint
tăng bao nhiêu cũng được. Fail test thì upload báo cáo, nếu không log CI chỉ nói
"test failed" mà không nói luật nào bị vi phạm.

---

→ Thứ tự thực hiện: [03-roadmap.md](03-roadmap.md)
→ Quy ước chi tiết: [04-conventions.md](04-conventions.md)
