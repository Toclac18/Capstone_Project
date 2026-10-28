# 03 — Lộ trình refactor global

## Ràng buộc phải tôn trọng

Repo đang có **20+ nhánh feature mở** và **4 người commit song song** (`vdhung900` 91, `Quannt18` 56, `Quangz32` 31, `AnhDuc77` 22 trên 200 commit gần nhất). Di chuyển file hàng loạt sẽ gây conflict ở **mọi** nhánh đang mở — Git không theo dõi được "file này đã dời chỗ" khi nội dung cũng đổi.

Vì vậy lộ trình tuân thủ 3 quy tắc:

1. **Giai đoạn di chuyển file phải gộp nhánh trước, làm trong 1 ngày, merge ngay.** Không để nhánh refactor sống quá 24h.
2. **Mỗi phase là một PR độc lập, build xanh.** Không có PR nào "sửa dở".
3. **Sửa lỗi trước, dời chỗ sau, ép luật cuối.** Guardrail bật ở chế độ cảnh báo trước khi bật chặn.

---

## Tổng quan

| Phase | Nội dung | Rủi ro | Dừng tính năng? |
|---|---|---|---|
| **0** | Vá P0 — an toàn production | Thấp | Không |
| **1** | Hợp đồng API một hình dạng | Trung bình | Không |
| **2** | Gộp 72 BFF route | Thấp | Không |
| **3** | Dời cấu trúc thư mục BE + FE | Cao (conflict) | **Có — 1 ngày** |
| **4** | Tách God Service + event | Trung bình | Không |
| **5** | Guardrail + CI | Thấp | Không |

Phase 0–2 và 5 làm song song với phát triển tính năng. Chỉ Phase 3 cần "đóng băng" nhánh.

---

## Phase 0 — Vá P0 (ưu tiên tuyệt đối)

Mỗi mục là một PR nhỏ, review nhanh, merge ngay. Không phụ thuộc lẫn nhau.

| # | Việc | File |
|---|---|---|
| 0.1 | Thêm Flyway, sinh `V1__baseline.sql` từ schema dev, prod đổi sang `ddl-auto=validate` | `build.gradle`, `resources/db/migration/` |
| 0.2 | Xóa `AiProcessingJobTableMigration.java`, chuyển DDL vào `V2__ai_processing_jobs.sql` | `config/migration/` |
| 0.3 | Xoá 2 file seeder chết (`OrganizationSeeder`, `ReaderSeeder` — comment toàn bộ) | `config/seed/` |
| 0.4 | Chuyển `DocumentStatusFixer`, `ReviewRequestStatusFixer` thành migration Flyway `V3`/`V4`, xoá class Java | `config/seed/` → `db/migration/` |
| 0.5 | Ký HMAC webhook AI; bỏ `/v1/ai/webhook` khỏi `permitAll()` | `SecurityConfig`, `AiWebhookController`, AI `callback` |
| 0.6 | Bỏ `/dev/**` khỏi `permitAll()` | `SecurityConfig` |
| 0.7 | Tách `application-{dev,prod,test}.yml` | `resources/` |
| 0.8 | Sửa `DEFAULT_BE_BASE` 8081 → 8080; cho mặc định cookie name khớp môi trường | `server/config.ts` |
| 0.9 | `NEXT_PUBLIC_API_BASE_URL` → `API_BASE_URL` (server-only). **Không phải vá rò** — đã kiểm, chưa rò; làm để một import từ client sau này không rò được | `server/config.ts`, `next.config.ts`, env |

**Đã kiểm và BỎ khỏi Phase 0:**

| ~~Mục~~ | Vì sao bỏ |
|---|---|
| ~~Thêm `middleware.ts`~~ | `src/proxy.ts` đã là middleware của Next.js 16 và đang chạy. Thêm `middleware.ts` **làm vỡ build** — Next báo lỗi khi có cả hai file. |
| ~~Rà `UserController`~~ | Chỉ có endpoint self-service, lấy user qua `@AuthenticationPrincipal`. Không cần role check. |
| ~~Vá cookie name~~ | FE tự set và tự đọc qua cùng hằng số `COOKIE_NAME`; lệch mặc định vẫn tự khớp. Gộp vào 0.8 như việc dọn. |

**Ước lượng:** 2–3 ngày cho 1 người. 0.1 và 0.5 chiếm phần lớn.

> 0.7 (tách profile) đụng cùng `application.yml` với 0.1 và 0.5 ⇒ làm **sau** khi hai PR đó merge, nếu không sẽ chắc chắn conflict.

> **Lưu ý 0.1:** baseline Flyway phải sinh từ schema **đang chạy ở prod**, không phải từ entity. Hai cái đã lệch nhau sau nhiều tháng `ddl-auto=update`. Chạy `pg_dump --schema-only` trên prod, so với dev, chốt khác biệt trước khi baseline.

---

## Phase 1 — Hợp đồng API một hình dạng

Đây là phase mở khóa mọi thứ phía FE: chừng nào còn 3 hình dạng response, FE còn phải `any`.

1. Thêm `pageInfo` / `errorCode` / `fieldErrors` vào `ApiResponse` + factory `ApiResponse.page()`.
2. Gộp `PagedResponse<T>` vào `ApiResponse<List<T>>` rồi xoá lớp riêng — JSON không đổi,
   nên 39 endpoint phân trang không làm vỡ FE.
3. Chuyển 5 endpoint trả `Page<T>` thô sang `ApiResponse.page()` — **đây là chỗ đổi hình
   dạng trên dây**, nên 5 handler FE tiêu thụ chúng phải sửa cùng commit.
4. `GlobalExceptionHandler`: `errorCode` ra cấp ngoài (dùng enum `ErrorCode` đã có).
   13/23 handler hiện không gán mã nào — phải gán hết.
5. `ResponseWrapperAdvice`: bỏ nhánh bỏ qua `Page<?>`, bọc nó lại kèm log cảnh báo.
6. FE: `types/api.ts` mô tả hợp đồng; `http.ts` thêm `unwrap<T>()` và `errorCode` vào
   `ApiError`; xoá các nhánh đoán hình dạng ở 5 handler nói trên.

> Viết lại 38 service FE để dùng `unwrap` **không** thuộc Phase 1: chúng trả cả vỏ
> response và component đọc `.data` / `.pageInfo` trực tiếp, đổi hết là ~70 file.
> Việc đó đi cùng Phase 3 khi code chuyển sang feature module.

**Thứ tự:** làm BE trước, FE theo sau trong cùng PR. Phải cùng PR — đây là breaking change của contract.

**Ước lượng:** 2 ngày. Ảnh hưởng 74 controller method nhưng đều là sửa cơ học.

---

## Phase 2 — Gộp 72 BFF route

Làm **tăng dần**, không big-bang. Thứ tự an toàn:

1. Viết `server/bff.ts` + `server/route-map.ts` + `server/route-types.ts` + `app/api/[...path]/route.ts`.
   Tên `bff.ts` chứ không phải `proxy.ts`: `src/proxy.ts` đã là middleware của Next.js 16.
2. Chuyển **1 nhóm** sang bảng route (gợi ý: `business-admin/*`, 13 route) → xóa file → test → merge.
3. Lặp theo nhóm: `org-admin/*`, `reader/*`, `documents/*`, `system-admin/*`, phần còn lại.
4. 66 route còn lại (transform, formdata, stream, side effect): giữ file riêng.
5. Mock lùi sau `server/backend/` interface; chuyển `src/mock` → `src/mocks` ngoài `src/`.

Mỗi nhóm là một PR. Nếu nhóm nào hỏng, rollback chỉ nhóm đó.

**Thu được:** −4.920 LOC (72 file) thay bằng 344 dòng kernel; `route.ts` giảm từ 138 còn 67 file. Và 21 route thiếu auth + 19 route thiếu error boundary được vá theo cấu trúc.

> Ước lượng ban đầu là −8.238 LOC cho 108 route. Phép lọc "proxy thuần" lúc đó quá
> lỏng; số thực đo khi thực thi là 72 route — xem [01-assessment.md](01-assessment.md) §P1-1.
>
> Một route **không** được di trú dù trông như proxy: `auth/login` gọi `cookieStore.set()`
> để ghi cookie JWT. Tiêu chí lọc phải loại cả side effect, không chỉ biến đổi dữ liệu.

**Ước lượng:** 3–4 ngày, chia được cho 2 người theo nhóm route.

---

## Phase 3 — Dời cấu trúc thư mục ⚠️ cần đóng băng nhánh

**Đây là phase duy nhất cần phối hợp cả team.** Kế hoạch 1 ngày:

### Chuẩn bị (hôm trước)
- Tất cả nhánh feature đang mở: merge vào `dev` hoặc đóng. **Không để nhánh nào sống qua đêm.**
- Chốt sơ đồ ánh xạ file cũ → mới, review trước (xem `04-conventions.md`).

### Ngày thực hiện
| Giờ | Việc |
|---|---|
| Sáng | BE: `git mv` theo module. Dùng **IDE refactor** (IntelliJ *Move Package*) để tự sửa import, không sửa tay. |
| | Chạy `gradle build` sau **mỗi** module, không dồn cuối. |
| Chiều | FE: dời `services/` → `features/*/api`, `types/` → `features/*/types`, gom `components/ui` → `shared/ui`. |
| | `tsc --noEmit` sau mỗi feature. |
| Cuối ngày | Merge thẳng vào `dev`. Thông báo team `git pull` trước khi tạo nhánh mới. |

### Quy tắc bắt buộc
- **Chỉ di chuyển, không sửa logic.** Diff phải thuần rename. PR nào lẫn thay đổi hành vi thì tách ra.
- Dùng `git mv` để Git nhận diện rename → `git log --follow` vẫn truy được lịch sử.
- Việc dọn `(template)` (3.236 LOC, **26 page đang import**) tách thành PR riêng **sau** Phase 3: tách phần đang dùng sang `shared/ui`, rồi mới xóa phần còn lại.

**Ước lượng:** 1 ngày tập trung + 1 ngày dư chấn.

---

## Phase 4 — Tách God Service

Không làm cùng lúc tất cả. Thứ tự theo mức đau:

1. **`DocumentServiceImpl`** (1.811 LOC / 26 dep) → `Query` / `Command` / `Upload` + event listener.
2. **`ReviewRequestServiceImpl`** (1.291 / 13).
3. **`UserServiceImpl`** (1.095 / 14).
4. **`*StatisticsServiceImpl`** (1.429 + 634 + 484 + 375) → gộp về `modules/statistics` với repository chuyên dụng cho truy vấn tổng hợp.

Đòn bẩy lớn nhất là **`ApplicationEventPublisher`**: chuyển notification + email + cộng điểm ra khỏi thân hàm nghiệp vụ. Chỉ riêng việc này cắt được 6–8 dependency của `DocumentServiceImpl`.

**Viết test trước khi tách.** Phase này là nơi duy nhất bắt buộc có test — không có lưới thì tách service là đặt cược. Tối thiểu: integration test cho các luồng chính của document và review.

**Ước lượng:** 1–1.5 tuần, chia theo service cho từng người.

---

## Phase 5 — Guardrail + CI

Làm **song song từ Phase 0**. Không cần chờ Phase 3: `FreezingArchRule` cho phép bật
luật ngay trên nợ hiện tại, và ngân sách `--max-warnings` làm điều tương tự cho ESLint.

**Đã làm:**

1. `be/src/test/.../architecture/ArchitectureTest.java` — 10 luật. 6 luật đang sạch đặt
   `fail` ngay; 4 luật còn vi phạm dùng `FreezingArchRule`: nợ hiện tại ghi vào
   `be/archunit_store`, chỉ vi phạm **mới** làm fail. Không cần đợi Phase 3 mới bật.
2. FE: ranh giới tầng bằng `no-restricted-imports` sẵn có, đặt `error` cho 3 nhóm đang
   sạch (`services/`, `types/`+`utils/`, `components/`+`hooks/`).
   **Không** dùng `eslint-plugin-boundaries`: cấu trúc hiện tại phẳng theo kiểu file nên
   luật sẵn có đủ sức; plugin đó chỉ đáng thêm ở Phase 3 khi có `features/<name>` và cần
   chặn `features/a ↔ features/b` bằng capture cùng tên.
3. CI: bật lại `push: [dev]`; thêm bước `tsc --noEmit` riêng (fail nhanh hơn `next build`);
   lint đổi sang `--max-warnings <số hiện tại>`; upload test report khi fail.
4. `ai/` vào CI: `python -m compileall` + `ruff --select=E9,F63,F7,F82` (lỗi cú pháp, so
   sánh sai kiểu, câu lệnh sai chỗ, tên chưa định nghĩa — gần như không false positive).

**Chưa làm:**

| Việc | Vì sao |
|---|---|
| Job `contract`: sinh lại `api.ts` từ OpenAPI rồi `git diff --exit-code` | Cần dựng được BE trong CI để lấy `/v3/api-docs`, tức cần Postgres service container. Việc riêng. |
| `pytest` cho `ai/` | Chưa có test nào, và cài `requirements.txt` cần GPU/torch — quá nặng cho CI runner. |
| Luật ranh giới module trong ArchUnit | Cần `modules/` tồn tại, tức sau Phase 3. |
| Hạ dần ngân sách `--max-warnings` | Ratchet: dọn bớt warning thì hạ số xuống. 317/408 warning là `no-explicit-any`. |

**Ước lượng:** 2 ngày (phần đã làm).

---

## Tổng thời lượng

| Phase | Người-ngày | Song song được? |
|---|---:|---|
| 0 | 3 | ✓ |
| 1 | 2 | — |
| 2 | 4 | ✓ (2 người) |
| 3 | 2 | ✗ cả team |
| 4 | 7 | ✓ (theo service) |
| 5 | 2 | ✓ |

**≈ 20 người-ngày.** Với 4 người và làm xen kẽ phát triển tính năng: **3–4 tuần lịch**.

---

## Thứ tự nếu thời gian eo hẹp

Nếu chỉ làm được một phần, giá trị trên công sức theo thứ tự:

1. **Phase 0** — đây là lỗi production, không phải nợ kỹ thuật. Không bỏ qua được.
2. **Phase 2** — xóa 8.2k LOC, rủi ro thấp, thấy kết quả ngay.
3. **Phase 1** — mở khóa type safety cho toàn FE.
4. **Phase 5** — rẻ, và là thứ giữ cho 1–3 không hỏng lại.
5. **Phase 3** — đẹp và đúng, nhưng tốn phối hợp nhất.
6. **Phase 4** — có thể làm dần khi refactor từng luồng, đúng như kế hoạch ban đầu.

> Phase 3 xếp sau Phase 2 là có chủ đích: gộp BFF **trước** khi dời thư mục nghĩa là chỉ phải dời ~30 file thay vì 138.
