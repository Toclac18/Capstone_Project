package com.capstone.be.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.library.freeze.FreezingArchRule;
import jakarta.persistence.Entity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

/**
 * Guardrail kiến trúc — chạy như test JUnit thường trong {@code ./gradlew build}.
 *
 * <p>Ranh giới nào không có công cụ kiểm thì sẽ hỏng lại sau vài sprint. Đây là
 * công cụ đó, và nó báo lỗi ngay tại PR.
 *
 * <p><b>Hai loại luật trong file này:</b>
 *
 * <ul>
 *   <li><b>Luật chặt</b> — đang sạch, vi phạm là fail ngay.
 *   <li><b>Luật đóng băng</b> ({@link FreezingArchRule}) — đang có vi phạm. Những vi phạm
 *       đó được ghi vào {@code be/archunit_store} và bỏ qua; CHỈ vi phạm MỚI làm fail.
 *       Nhờ vậy luật bật được ngay thay vì chờ dọn sạch, và nợ cũ nằm trong git nên
 *       đọc được. Dọn bớt một vi phạm thì store tự cập nhật ở lần chạy sau.
 * </ul>
 *
 * <p>Luật ranh giới module ({@code modules.X} không được gọi {@code modules.Y.repository})
 * chỉ thêm được sau khi Phase 3 dời thư mục — xem docs/architecture/04-conventions.md §3.
 */
@AnalyzeClasses(
    packages = "com.capstone.be",
    importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

  // ═════════════════ Luật chặt — đang sạch ═════════════════

  @ArchTest
  static final ArchRule service_khong_duoc_phu_thuoc_controller =
      noClasses()
          .that().resideInAPackage("..service..")
          .should().dependOnClassesThat().resideInAPackage("..controller..")
          .because("service không được biết ai gọi nó");

  @ArchTest
  static final ArchRule repository_khong_duoc_phu_thuoc_nghiep_vu =
      noClasses()
          .that().resideInAPackage("..repository..")
          .should().dependOnClassesThat()
          .resideInAnyPackage("..service..", "..controller..")
          .because("repository chỉ biết entity, không biết nghiệp vụ");

  @ArchTest
  static final ArchRule entity_la_tang_trong_cung =
      noClasses()
          .that().resideInAPackage("..domain.entity..")
          .should().dependOnClassesThat()
          .resideInAnyPackage("..service..", "..controller..", "..repository..")
          .because("entity không được biết gì về các tầng ngoài");

  @ArchTest
  static final ArchRule khong_dung_field_injection =
      noFields()
          .should().beAnnotatedWith(Autowired.class)
          .because("dùng constructor injection — phụ thuộc phải hiện ra ở constructor, "
              + "đó là cách duy nhất nhìn thấy service nào đang phình ra");

  @ArchTest
  static final ArchRule seeder_phai_gioi_han_profile =
      classes()
          .that().resideInAPackage("..config.seed..")
          .and().areAnnotatedWith(Component.class)
          .should().beAnnotatedWith(Profile.class)
          .because("DocumentStatusFixer và ReviewRequestStatusFixer từng chạy UPDATE "
              + "trên dữ liệu prod mỗi lần khởi động vì thiếu giới hạn profile");

  @ArchTest
  static final ArchRule controller_dat_ten_dung =
      classes()
          .that().areAnnotatedWith(RestController.class)
          .should().haveSimpleNameEndingWith("Controller");

  // ═══════ Luật đóng băng — đang có vi phạm, chỉ fail cái MỚI ═══════

  @ArchTest
  static final ArchRule controller_khong_duoc_cham_repository =
      FreezingArchRule.freeze(
          noClasses()
              .that().areAnnotatedWith(RestController.class)
              .should().dependOnClassesThat().resideInAPackage("..repository..")
              .because("controller đi qua service; chạm repository là bỏ qua tầng "
                  + "nghiệp vụ và transaction boundary"));

  @ArchTest
  static final ArchRule controller_khong_duoc_mo_transaction =
      FreezingArchRule.freeze(
          noMethods()
              .that().areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
              .should().beAnnotatedWith(Transactional.class)
              .because("transaction boundary thuộc tầng service, không phải controller"));

  @ArchTest
  static final ArchRule controller_khong_duoc_cham_entity =
      FreezingArchRule.freeze(
          noClasses()
              .that().areAnnotatedWith(RestController.class)
              .should().dependOnClassesThat().areAnnotatedWith(Entity.class)
              .because("controller nhận và trả DTO; để entity lọt ra API là "
                  + "gắn hình dạng bảng vào hợp đồng công khai"));

  @ArchTest
  static final ArchRule controller_khong_duoc_tra_Page_tho =
      FreezingArchRule.freeze(
          noMethods()
              .that().areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
              .should(returnTypeMentioning("org.springframework.data.domain.Page"))
              .because("Page<T> thô là hình dạng response thứ ba mà Phase 1 xoá bỏ; "
                  + "dùng ApiResponse.page(...) — xem docs/architecture/02 §1.4"));

  /**
   * Kiểu trả về có nhắc tới một lớp nào đó, kể cả ở tham số generic.
   *
   * <p>Không dùng {@code haveRawReturnType(Page.class)} được: raw type của
   * {@code ResponseEntity<Page<T>>} là {@code ResponseEntity}, nên luật đó không bắt
   * được gì — nó "pass" một cách vô nghĩa. ArchUnit phơi full generic signature qua
   * {@code getReturnType().getName()}, nên so trên chuỗi đó.
   */
  private static ArchCondition<JavaMethod> returnTypeMentioning(String fqcn) {
    return new ArchCondition<>("có kiểu trả về nhắc tới " + fqcn) {
      @Override
      public void check(JavaMethod method, ConditionEvents events) {
        String returnType = method.getReturnType().getName();
        boolean mentions =
            returnType.equals(fqcn)
                || returnType.contains(fqcn + "<")
                || returnType.contains("<" + fqcn);
        if (mentions) {
          events.add(SimpleConditionEvent.satisfied(
              method, method.getFullName() + " trả về " + returnType));
        }
      }
    };
  }
}
