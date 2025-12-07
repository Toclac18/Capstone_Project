package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.DocumentSeededEvent;
import com.capstone.be.config.seed.event.TagSeededEvent;
import com.capstone.be.domain.entity.*;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Seeder for Document AND Read History (dev profile only)
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
  private final CommentRepository commentRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final TagRepository tagRepository;
  private final DocumentTagLinkRepository documentTagLinkRepository;

  // Inject thêm Repository này
  private final DocumentReadHistoryRepository documentReadHistoryRepository;

  private final ApplicationEventPublisher eventPublisher;


  @Transactional
  @EventListener(TagSeededEvent.class)
  public void run() {
    log.info("\uD83C\uDF31 Start seeding Document & History");

    if (documentRepository.count() > 0) {
      log.warn("Document already exist → skip seeding.");
      eventPublisher.publishEvent(new DocumentSeededEvent());
      return;
    }

    // 1. Tạo 3 document
    for (int i = 0; i < 3; i++) {
      createDocument(i);
    }

    // 2. Sau khi tạo xong Document thì tạo luôn History
    seedReadHistory();



    //3. Tạo luôn comment cho docs theo id hiện có
    genCommentForDocument();

    eventPublisher.publishEvent(new DocumentSeededEvent());

  }

  private void createDocument(int seed) {
    OrganizationProfile orgProfile =
            organizationProfileRepository.findByEmail("contact@hust.edu.vn").orElse(null);

    User user = userRepository.findByEmail("reader1@gmail.com").orElse(null);

    List<DocType> docTypes = docTypeRepository.findAll();
    DocType docType = docTypes.isEmpty() ? null : docTypes.get(0);

    List<Specialization> specs = specializationRepository.findAll();
    Specialization spec = specs.isEmpty() ? null : specs.get(0);

    if (docType == null || spec == null) {
      log.warn("⚠️ DocType or Specialization missing. Skipping document seed " + seed);
      return;
    }

    com.capstone.be.domain.entity.DocumentSummarization summarization = DocumentSummarization.builder()
            .shortSummary("Tóm tắt ngắn gọn cho tài liệu số " + (seed + 1) + ". Nội dung bao quát các khái niệm chính.")
            .mediumSummary("Tóm tắt vừa phải: Tài liệu này đi sâu vào lý thuyết và thực hành, cung cấp cái nhìn tổng quan về chủ đề với các ví dụ minh họa cụ thể cho tài liệu " + (seed + 1) + ".")
            .detailedSummary("Tóm tắt chi tiết: Đây là bản phân tích đầy đủ, kết nối các phương pháp cổ điển với các phát triển hiện đại. Tài liệu làm rõ các giả định, điều kiện biên và tính hợp lệ thống kê của các phát hiện được báo cáo, đồng thời đề xuất các tiêu chuẩn có thể tái lập cho tài liệu số " + (seed + 1) + ".")
            .build();

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
            .price(100 + (seed * 50))
            .thumbnailKey("/thumbnail-3.jpg")
            .fileKey("file-" + (seed + 1) + ".pdf")
            .pageCount(20 + (seed * 10))
            .status(DocStatus.ACTIVE)
            .specialization(spec)
            .summarizations(summarization)
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

  /**
   * Logic tạo lịch sử đọc cho user reader1
   */
  private void seedReadHistory() {
    if (documentReadHistoryRepository.count() > 0) {
      log.warn("History already exists → skip.");
      return;
    }

    User reader = userRepository.findByEmail("reader1@gmail.com").orElse(null);
    if (reader == null) return;

    List<Document> documents = documentRepository.findAll();

    for (int i = 0; i < documents.size(); i++) {
      Document doc = documents.get(i);

      DocumentReadHistory history = DocumentReadHistory.builder()
              .id(SeedUtil.generateUUID("history-" + i))
              .user(reader)
              .document(doc)
              // Có thể set createdAt nếu Entity cho phép để test sort history
              // .createdAt(Instant.now().minusSeconds(i * 3600))
              .build();

      documentReadHistoryRepository.save(history);
      log.info("\uD83D\uDCD6 Created history: User read " + doc.getTitle());
    }
  }

  private void genCommentForDocument() {
    // 1. Danh sách email theo yêu cầu
    List<String> targetEmails = List.of(
            "reader1@gmail.com",
            "reader2@gmail.com",
            "reader3@gmail.com",
            "reader4@gmail.com",
            "reader5@gmail.com",
            "reader.pending@gmail.com"
    );

    // 2. Tìm User entity từ Email
    // Chúng ta lọc qua danh sách email và tìm trong DB.
    // Nếu email nào không có trong DB thì sẽ bị bỏ qua (filter nonNull).
    List<User> users = targetEmails.stream()
            .map(email -> userRepository.findByEmail(email).orElse(null)) // findByEmail được dùng ở createDocument
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    if (users.isEmpty()) {
      log.warn("⚠️ Không tìm thấy User nào thuộc danh sách email yêu cầu. Bỏ qua việc tạo comment.");
      return;
    }

    log.info("Found {} users for commenting.", users.size());

    // 3. Cấu hình số lượng comment cho từng Document ID
    Map<String, Integer> docsConfig = new LinkedHashMap<>();
    docsConfig.put("1d2eb26d-a92d-3183-ae10-2448113ec466", 20);
    docsConfig.put("cabcf898-23b3-37a8-a036-b70c2e50c0c6", 5);
    docsConfig.put("0b4756cb-b920-38f6-b05e-6ddcd50b289b", 0);

    List<Comment> commentsToSave = new ArrayList<>();

    // Biến con trỏ để xoay vòng user
    int[] userCursor = {0};

    // 4. Duyệt qua config và tạo comment
    docsConfig.forEach((docIdStr, count) -> {
      if (count > 0) {
        UUID docId = UUID.fromString(docIdStr);

        // Kiểm tra Document có tồn tại không trước khi tạo comment
        documentRepository.findById(docId).ifPresentOrElse(
                document -> {
                  for (int i = 1; i <= count; i++) {
                    // Lấy user theo vòng tròn: user 1 -> user 2 -> ... -> user N -> user 1
                    User currentUser = users.get(userCursor[0] % users.size());
                    userCursor[0]++;

                    Comment comment = Comment.builder()
                            .document(document)
                            .user(currentUser) // Gán user
                            .content("Đây là bình luận mẫu số " + i + ". Người dùng " + currentUser.getEmail() + " thấy tài liệu này rất hữu ích.")
                            .isDeleted(false)
                            // ID, CreatedAt, UpdatedAt được BaseEntity tự động xử lý
                            .build();

                    commentsToSave.add(comment);
                  }
                },
                () -> log.warn("⚠️ Document ID {} không tồn tại, bỏ qua tạo comment.", docIdStr)
        );
      }
    });

    // 5. Lưu vào Database
    if (!commentsToSave.isEmpty()) {
      commentRepository.saveAll(commentsToSave);
      log.info("✅ Đã tạo thành công {} comments phân bổ cho {} users.", commentsToSave.size(), users.size());
    }
  }
}