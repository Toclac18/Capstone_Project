package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.TagSeededEvent;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeder for Document (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentSeeder {

  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final DocTypeRepository docTypeRepository;
  private final SpecializationRepository specializationRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final TagRepository tagRepository;
  private final DocumentTagLinkRepository documentTagLinkRepository;


  @Transactional
  @EventListener(TagSeededEvent.class)
  public void run() {
    log.info("\uD83C\uDF31 Start seeding Document");

    if (documentRepository.count() > 0) {
      log.warn("Document already exist → skip seeding.");
      return;
    }

    // Tạo 3 document
    for (int i = 0; i < 3; i++) {
      createDocument(i);
    }

  }

  private void createDocument(int seed) {
    OrganizationProfile orgProfile =
            organizationProfileRepository.findByEmail("contact@hust.edu.vn").orElse(null);

    User user = userRepository.findByEmail("reader1@gmail.com").orElse(null);

    // Lấy list để có thể random nếu muốn, ở đây lấy phần tử đầu tiên cho an toàn
    List<DocType> docTypes = docTypeRepository.findAll();
    DocType docType = docTypes.isEmpty() ? null : docTypes.get(0);

    List<Specialization> specs = specializationRepository.findAll();
    Specialization spec = specs.isEmpty() ? null : specs.get(0);

    if (docType == null || spec == null) {
      log.warn("⚠️ DocType or Specialization missing. Skipping document seed " + seed);
      return;
    }

    // Tạo nội dung tóm tắt mẫu
    DocumentSummarization summarization = DocumentSummarization.builder()
            .shortSummary("Tóm tắt ngắn gọn cho tài liệu số " + (seed + 1) + ". Nội dung bao quát các khái niệm chính.")
            .mediumSummary("Tóm tắt vừa phải: Tài liệu này đi sâu vào lý thuyết và thực hành, cung cấp cái nhìn tổng quan về chủ đề với các ví dụ minh họa cụ thể cho tài liệu " + (seed + 1) + ".")
            .detailedSummary("Tóm tắt chi tiết: Đây là bản phân tích đầy đủ, kết nối các phương pháp cổ điển với các phát triển hiện đại. Tài liệu làm rõ các giả định, điều kiện biên và tính hợp lệ thống kê của các phát hiện được báo cáo, đồng thời đề xuất các tiêu chuẩn có thể tái lập cho tài liệu số " + (seed + 1) + ".")
            .build();

    // Biến đổi title và description theo seed
    String[] titles = {"Sách giáo khoa Toán 11", "Nhập môn Lập trình Java", "Kinh tế vĩ mô căn bản"};
    String title = seed < titles.length ? titles[seed] : "Tài liệu tham khảo " + seed;

    Document document = Document.builder()
            .id(SeedUtil.generateUUID("doc-" + seed))
            .title(title)
            .description("Mô tả chi tiết cho " + title + ". Quyển sách này rất hữu ích cho sinh viên.")
            .uploader(user)
            .organization(orgProfile)
            .visibility(DocVisibility.PUBLIC)
            .docType(docType)
            .isPremium(true)
            .price(100 + (seed * 50)) // Giá: 100, 150, 200
            .thumbnailKey("thumbnail-" + (seed + 1) + ".png")
            .fileKey("file-" + (seed + 1) + ".pdf")
            .pageCount(20 + (seed * 10))
            .status(DocStatus.VERIFIED)
            .specialization(spec)
            .summarizations(summarization) // Set summarization vào entity
            .build();

    Document savedDoc = documentRepository.save(document);

    // Gán tags
    Tag tag1 = tagRepository.findByCode(1L).orElse(null);
    Tag tag2 = tagRepository.findByCode(2L).orElse(null);

    if (tag1 != null && tag2 != null) {
      var link1 = DocumentTagLink.builder().tag(tag1).document(savedDoc).build();
      var link2 = DocumentTagLink.builder().tag(tag2).document(savedDoc).build();

      documentTagLinkRepository.save(link1);
      documentTagLinkRepository.save(link2);
    }

    log.info("✅ Created document: " + savedDoc.getTitle());
  }
}