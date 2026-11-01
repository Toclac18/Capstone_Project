# 04 — Quy ước & Guardrail

Tài liệu này là thứ dán lên tường. Mọi PR sau Phase 3 phải tuân thủ.

---

## 1. Quy ước đặt tên

### Backend

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Package module | số ít, thường | `modules.document` |
| Controller | `<Resource>Controller` | `DocumentController` |
| Service interface | `<Resource><Verb>Service` | `DocumentQueryService` |
| Implementation | cùng package `service`, hậu tố `Impl` | `DocumentQueryServiceImpl` |
| DTO request | `<Action><Resource>Request` | `CreateDocumentRequest` |
| DTO response | `<Resource>Response` | `DocumentResponse` |
| Specification | `<Entity>Specification` | `DocumentSpecification` |
| Event | `<Resource><PastTense>Event` | `DocumentApprovedEvent` |

**Bỏ `repository/spec/`** — gộp vào `repository/specification/` (hiện 1 file lạc chỗ).

### Frontend

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Thư mục | `kebab-case` **luôn luôn** | `features/document/` |
| Component file | `PascalCase.tsx` | `DocumentCard.tsx` |
| Hook | `use-kebab.ts` | `use-document-list.ts` |
| API module | `<resource>.api.ts` | `document.api.ts` |
| Type file | `<resource>.types.ts` | `document.types.ts` |
| Component nội bộ page | `_components/` (gạch dưới) | — |

**Cần sửa ngay:** `policyService.ts`, `roleManagementService.ts`, `systemLogService.ts`, `charts.services.ts` → `*.api.ts`. Thư mục `AlertDialog/`, `ConfirmModal/`, `ModalPreview/`, `PolicyViewer/`, `SaveListModal/` → kebab-case trong `shared/ui/`.

---

## 2. Luật phụ thuộc

### Backend

```
✓ modules.X.api        → modules.X.service, modules.X.domain
✓ modules.X.service    → modules.X.repository, modules.X.domain, shared.**, modules.Y.spi
✓ modules.X.repository → modules.X.domain, shared.persistence
✓ bootstrap            → bất kỳ (chỉ seed)

✗ modules.X.*          → modules.Y.repository      (cấm tuyệt đối)
✗ modules.X.*          → modules.Y.service         (cấm — dùng Y.spi)
✗ modules.X.api        → modules.X.repository      (controller không chạm repo)
✗ shared.**            → modules.**                (kernel không biết module)
```

### Frontend

```
✓ app/**        → features/*/api, features/*/components (export công khai), shared/**
✓ features/X    → shared/**, features/X/**
✓ shared/**     → shared/**

✗ features/X    → features/Y          (hai feature không gọi nhau)
✗ shared/**     → features/**         (shared không biết feature)
✗ app|features  → mocks/**            (mock không vào code thật)
✗ bất kỳ        → app/(template)/**   (sau khi đã tách)
```

> Hai feature cần dùng chung thì phần dùng chung **lên `shared/`**, không gọi ngang.

---

## 3. ArchUnit — guardrail backend

`be/src/test/java/com/capstone/be/architecture/ArchitectureTest.java`

```java
@AnalyzeClasses(packages = "com.capstone.be",
                importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

  // ── Ranh giới module ────────────────────────────────────────────
  @ArchTest
  static final ArchRule modules_only_talk_through_spi =
      SlicesRuleDefinition.slices()
          .matching("..modules.(*)..")
          .namingSlices("$1")
          .should().notDependOnEachOther()
          .ignoreDependency(
              resideInAPackage("..modules.."),
              resideInAPackage("..spi.."));

  @ArchTest
  static final ArchRule no_cross_module_repository_access =
      noClasses().that().resideInAPackage("..modules.(*)..")
          .should().dependOnClassesThat(
              new DescribedPredicate<>("repository của module khác") {
                public boolean test(JavaClass t) {
                  return t.getPackageName().matches(".*modules\\.\\w+\\.repository.*");
                }
              });

  // ── Kernel không biết module ────────────────────────────────────
  @ArchTest
  static final ArchRule shared_is_independent =
      noClasses().that().resideInAPackage("..shared..")
          .should().dependOnClassesThat().resideInAPackage("..modules..");

  // ── Tầng ────────────────────────────────────────────────────────
  @ArchTest
  static final ArchRule controllers_never_touch_repositories =
      noClasses().that().areAnnotatedWith(RestController.class)
          .should().dependOnClassesThat().resideInAPackage("..repository..")
          .because("controller đi qua service; hiện có 3 chỗ vi phạm");

  @ArchTest
  static final ArchRule no_transactional_in_controllers =
      noMethods().that().areDeclaredInClassesThat()
          .areAnnotatedWith(RestController.class)
          .should().beAnnotatedWith(Transactional.class);

  // ── Hợp đồng API ────────────────────────────────────────────────
  @ArchTest
  static final ArchRule controllers_never_return_raw_page =
      noMethods().that().areDeclaredInClassesThat()
          .areAnnotatedWith(RestController.class)
          .should().haveRawReturnType(
              assignableTo(org.springframework.data.domain.Page.class))
          .because("dùng ApiResponse.page(...); xem 02 §1.4");

  @ArchTest
  static final ArchRule entities_never_leave_the_backend =
      noClasses().that().areAnnotatedWith(RestController.class)
          .should().dependOnClassesThat().areAnnotatedWith(Entity.class)
          .because("controller trả DTO, không trả entity");

  // ── An toàn vận hành ────────────────────────────────────────────
  @ArchTest
  static final ArchRule seeders_must_be_dev_only =
      classes().that().resideInAPackage("..bootstrap.seed..")
          .and().areAnnotatedWith(Component.class)
          .should().beAnnotatedWith(Profile.class)
          .because("DocumentStatusFixer/ReviewRequestStatusFixer từng chạy UPDATE trên prod");

  @ArchTest
  static final ArchRule no_field_injection =
      noFields().should().beAnnotatedWith(Autowired.class)
          .because("dùng constructor injection");
}
```

```gradle
// build.gradle
testImplementation 'com.tngtech.archunit:archunit-junit5:1.3.0'
```

**Cách triển khai:** Phase 0–2 để các luật mới `@ArchIgnore` hoặc ghi log. Bật `fail` ngay sau Phase 3, khi cấu trúc đã đúng chỗ.

---

## 4. ESLint boundaries — guardrail frontend

> **Bản đang chạy khác bản dưới đây.** `eslint.config.mjs` hiện dùng
> `no-restricted-imports` sẵn có, không có plugin: cấu trúc hiện tại phẳng theo kiểu
> file nên ràng buộc chỉ là "thư mục A không import thư mục B", luật sẵn có đủ sức.
> Ba nhóm đang được ép ở mức `error` vì đang sạch:
>
> ```
> services/            không import app/, components/, mock/
> types/, utils/       không import app/, services/, components/, mock/
> components/, hooks/  không import app/, mock/
> ```
>
> `app/` → `mock/` còn 60 file nên chỉ `warn`, tính vào ngân sách `--max-warnings`.
>
> **Cấu hình dưới đây dành cho Phase 3**, khi `features/<name>` đã tồn tại và cần chặn
> `features/a ↔ features/b` bằng capture cùng tên — đó là việc `no-restricted-imports`
> không làm được, và là lý do duy nhất đáng thêm plugin.
>
> Một cái bẫy phải nhớ khi sửa file này: ESLint flat config **ghi đè cả rule**, không gộp
> pattern. Hai block cùng đặt `no-restricted-imports` cho cùng một file thì block sau xoá
> sạch block trước. Mỗi nhóm file phải tự liệt kê lại mọi pattern nó cần.

```js
// eslint.config.mjs
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app",      pattern: "src/app/**" },
        { type: "feature",  pattern: "src/features/*/**", capture: ["name"] },
        { type: "shared",   pattern: "src/shared/**" },
        { type: "server",   pattern: "src/server/**" },
        { type: "mocks",    pattern: "src/mocks/**" },
      ],
    },
    rules: {
      "boundaries/element-types": ["error", {
        default: "disallow",
        rules: [
          { from: "app",     allow: ["feature", "shared", "server"] },
          { from: "feature", allow: ["shared", ["feature", { name: "${from.name}" }]] },
          { from: "shared",  allow: ["shared"] },
          { from: "server",  allow: ["shared", "server"] },
          { from: "mocks",   allow: ["shared", "mocks"] },
        ],
      }],
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@/mocks/*"],          message: "Mock chỉ dùng qua server/backend" },
          { group: ["@/app/(template)/*"], message: "Template đã bỏ — dùng @/shared/ui" },
          { group: ["../../*"],            message: "Dùng alias @/ thay vì đi lùi nhiều cấp" },
        ],
      }],
      "@typescript-eslint/no-explicit-any": "warn", // → "error" sau Phase 1
    },
  },
];
```

---

## 5. Sơ đồ dời file (Phase 3)

### Backend

| Hiện tại | Đích |
|---|---|
| `controller/DocumentController.java` | `modules/document/api/` |
| `controller/Admin*Controller.java` | module tương ứng, `api/` |
| `service/DocumentService.java` + `service/impl/DocumentServiceImpl.java` | `modules/document/service/` |
| `repository/Document*Repository.java` | `modules/document/repository/` |
| `repository/specification/Document*.java` | `modules/document/repository/specification/` |
| `repository/spec/` | gộp vào `specification/` |
| `domain/entity/Document.java` | `modules/document/domain/` |
| `domain/enums/Doc*.java` | `modules/document/domain/` |
| `dto/request/document/**`, `dto/response/document/**` | `modules/document/api/dto/` |
| `mapper/DocumentMapper.java` | `modules/document/api/` |
| `dto/common/**` | `shared/api/` |
| `exception/**` + `config/GlobalExceptionHandler.java` | `shared/exception/` |
| `config/ResponseWrapperAdvice.java`, `config/annotation/**` | `shared/api/` |
| `security/**` + `config/filter/**` | `shared/security/` |
| `config/{Async,Cache,OpenApi,RestTemplate,Jpa}Config.java` | `shared/config/` |
| `config/AwsS3Config.java` + `service/FileStorageService` | `shared/storage/` |
| `config/seed/**`, `config/migration/**` | `bootstrap/seed/` · DDL → `resources/db/migration/` |
| `util/**` | `shared/util/` (riêng `AuditLogHelper` → `modules/administration`) |
| `domain/entity/common/BaseEntity.java` | `shared/persistence/` |

### Frontend

| Hiện tại | Đích |
|---|---|
| `app/reader/**`, `app/reviewer/**`, … | `app/(reader)/**`, `app/(reviewer)/**` |
| `app/api/**` (72 route chỉ chuyển tiếp) | **xóa** → `app/api/[...path]/route.ts` + `server/route-map.ts` |
| `app/api/**` (66 route còn lại) | giữ file riêng; Next ưu tiên route cụ thể hơn catch-all |
| `services/<x>.service.ts` | `features/<x>/api/<x>.api.ts` |
| `services/http.ts` | `shared/lib/http.ts` |
| `types/<x>.ts` | `features/<x>/types/` · phần chung → `shared/types/api.ts` (sinh tự động) |
| `components/ui/**`, `components/AlertDialog/`, … | `shared/ui/` (kebab-case) |
| `components/layouts/**` | `shared/ui/layouts/` |
| `components/(template)/**` | phần dùng → `shared/ui/`, phần còn lại **xóa** |
| `hooks/**` | `shared/hooks/` · hook riêng feature → `features/<x>/hooks/` |
| `utils/**` | `shared/utils/` |
| `lib/auth/`, `server/**` | `server/` (kernel BFF) |
| `mock/**` | `src/mocks/` (ngoài `src/`, không import được từ code thật) |
| `components/ui/*_GUIDE.md` | `docs/ui/` |

---

## 6. Checklist review PR

Dán vào `.github/pull_request_template.md`:

```markdown
### Kiến trúc
- [ ] Không import chéo module (BE) / chéo feature (FE)
- [ ] Controller không chạm repository, không trả entity, không trả `Page<?>`
- [ ] Service mới < 400 LOC và < 8 dependency
- [ ] Thay đổi schema đi qua file Flyway, không dựa vào `ddl-auto`
- [ ] Component mới đặt đúng: dùng 1 nơi → `_components/`, dùng nhiều nơi → `shared/ui/`
- [ ] Không thêm `any` mới
- [ ] DTO đổi → đã sinh lại `shared/types/api.ts`
```

---

## 7. Ngưỡng cảnh báo

Vượt ngưỡng không phải lỗi, nhưng phải giải thích trong PR:

| Chỉ số | Ngưỡng | Vi phạm hiện tại |
|---|---|---|
| LOC một service | 400 | **10** file |
| Dependency một service | 8 | **6** file (cao nhất: 26) |
| LOC một component React | 300 | **58** file (cao nhất: 1.270) |
| LOC một `page.tsx` | 150 | **12** file |
| `any` trong file mới | 0 | **303** toàn FE |

> 58 component vượt ngưỡng là con số lớn — đây là việc của giai đoạn refactor chi tiết từng luồng, **không** thuộc phạm vi global. Ngưỡng này chỉ áp cho code mới kể từ khi chốt tài liệu.
