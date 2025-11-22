package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.repository.DocTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for DocType (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class DocTypeSeeder {

  private final DocTypeRepository docTypeRepository;

  @Transactional
  @EventListener(UserSeededEvent.class)
  public void run() {
    if (docTypeRepository.count() > 0) {
      log.warn("Doc types already exist → skip seeding.");
      return;
    }

    log.info("Starting DocType seeding...");

    createDocType(1, "REPORT", "Báo cáo học tập, báo cáo tổng kết, báo cáo nghiên cứu.");
    createDocType(2, "THESIS", "Luận văn, khóa luận tốt nghiệp.");
    createDocType(3, "REFERENCE", "Tài liệu tham khảo, ebook, sách học thuật.");
    createDocType(4, "EXERCISE", "Bài tập, đề thi, bài mẫu.");
    createDocType(5, "FORM", "Biểu mẫu hành chính, giấy tờ nội bộ.");
    createDocType(6, "RESEARCH", "Bài báo khoa học, nghiên cứu chuyên sâu.");
    createDocType(7, "GUIDE", "Hướng dẫn sử dụng, tài liệu mô tả quy trình.");
    createDocType(8, "OTHER", "Các loại tài liệu khác không thuộc danh mục trên.");

    log.info("Seeded 8 Doc Types successfully.");
  }

  private void createDocType(int code, String name, String description) {
    DocType docType = DocType.builder()
        .id(SeedUtil.generateUUID("doctype-" + name))
        .code(code)
        .name(name)
        .description(description)
        .build();

    docTypeRepository.save(docType);
  }
}
