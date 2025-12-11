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

    // 1. Tạo 20 documents (nhiều data để test trending feature)
    for (int i = 0; i < 20; i++) {
      createDocument(i);
    }

    // 2. Sau khi tạo xong Document thì tạo luôn History
    seedReadHistory();

    // 3. Tạo comment cho docs
    genCommentForDocument();

    // 4. Tạo engagement data (views, votes)
    seedEngagementData();

    eventPublisher.publishEvent(new DocumentSeededEvent());

  }

  private void createDocument(int seed) {
    OrganizationProfile orgProfile =
            organizationProfileRepository.findByEmail("contact@hust.edu.vn").orElse(null);

    // Xoay vòng giữa các user để phân bổ documents
    List<User> users = userRepository.findAll();
    if (users.isEmpty()) {
      log.warn("⚠️ No users found. Skipping document seed " + seed);
      return;
    }
    User user = users.get(seed % users.size());

    List<DocType> docTypes = docTypeRepository.findAll();
    DocType docType = docTypes.isEmpty() ? null : docTypes.get(seed % docTypes.size());

    List<Specialization> specs = specializationRepository.findAll();
    Specialization spec = specs.isEmpty() ? null : specs.get(seed % specs.size());

    if (docType == null || spec == null) {
      log.warn("⚠️ DocType or Specialization missing. Skipping document seed " + seed);
      return;
    }

    com.capstone.be.domain.entity.DocumentSummarization summarization = DocumentSummarization.builder()
            .shortSummary("Tóm tắt ngắn gọn cho tài liệu số " + (seed + 1) + ". Nội dung bao quát các khái niệm chính.")
            .mediumSummary("Tóm tắt vừa phải: Tài liệu này đi sâu vào lý thuyết và thực hành, cung cấp cái nhìn tổng quan về chủ đề với các ví dụ minh họa cụ thể cho tài liệu " + (seed + 1) + ".")
            .detailedSummary("Tóm tắt chi tiết: Đây là bản phân tích đầy đủ, kết nối các phương pháp cổ điển với các phát triển hiện đại. Tài liệu làm rõ các giả định, điều kiện biên và tính hợp lệ thống kê của các phát hiện được báo cáo, đồng thời đề xuất các tiêu chuẩn có thể tái lập cho tài liệu số " + (seed + 1) + ".")
            .build();

    String[] titles = {
            "Sách giáo khoa Toán 11",
            "Nhập môn Lập trình Java",
            "Kinh tế vĩ mô căn bản",
            "Machine Learning cơ bản",
            "Thiết kế Database hiệu quả",
            "Hệ điều hành Linux",
            "Web Development với Spring Boot",
            "Xử lý tín hiệu số",
            "Mạng máy tính TCP/IP",
            "Thuật toán và Cấu trúc dữ liệu",
            "Lập trình song song",
            "Bảo mật thông tin",
            "AI và Deep Learning",
            "Phân tích dữ liệu với Python",
            "Cloud Computing AWS",
            "Docker và Kubernetes",
            "Microservices Architecture",
            "Reactive Programming",
            "GraphQL API Development",
            "Blockchain và Smart Contracts"
    };
    String title = seed < titles.length ? titles[seed] : "Tài liệu tham khảo " + seed;

    // Tạo engagement data để test trending (các documents gần đây sẽ có views/votes cao)
    int daysAgo = Math.max(0, 7 - (seed % 8)); // Docs mới nhất (daysAgo = 0) sẽ có views cao nhất
    int viewCount = (20 - seed) * 50; // Docs đầu tiên có views cao, giảm dần
    int upvoteCount = Math.max(0, (15 - seed) * 3);
    int downvoteCount = Math.max(0, (seed - 10) * 2);
    int voteScore = upvoteCount - downvoteCount;

    Document document = Document.builder()
            .id(SeedUtil.generateUUID("doc-" + seed))
            .title(title)
            .description("Mô tả chi tiết cho " + title + ". Quyển sách này rất hữu ích cho sinh viên và những người muốn học tập. Đây là tài liệu chất lượng cao được biên soạn bởi các chuyên gia trong ngành.")
            .uploader(user)
            .organization(orgProfile)
            .visibility(DocVisibility.PUBLIC)
            .docType(docType)
            .isPremium(seed % 3 != 0) // Một số là premium
            .price(seed % 3 != 0 ? 100 + (seed * 25) : 0)
            .thumbnailKey("/thumbnail-" + (seed % 5 + 1) + ".jpg")
            .fileKey("file-" + (seed + 1) + ".pdf")
            .pageCount(20 + (seed * 5))
            .status(DocStatus.ACTIVE)
            .specialization(spec)
            .summarizations(summarization)
            .viewCount(viewCount)
            .upvoteCount(upvoteCount)
            .voteScore(voteScore)
            .createdAt(Instant.now().minusSeconds(daysAgo * 24 * 60 * 60L))
            .build();

    Document savedDoc = documentRepository.save(document);

    // Gán tags
    List<Tag> allTags = tagRepository.findAll();
    if (allTags.size() >= 2) {
      Tag tag1 = allTags.get(seed % allTags.size());
      Tag tag2 = allTags.get((seed + 1) % allTags.size());

      if (!tag1.getId().equals(tag2.getId())) {
        var link1 = DocumentTagLink.builder().tag(tag1).document(savedDoc).build();
        var link2 = DocumentTagLink.builder().tag(tag2).document(savedDoc).build();

        documentTagLinkRepository.save(link1);
        documentTagLinkRepository.save(link2);
      }
    }

    log.info("✅ Created document #{}: {} (Views: {}, Upvotes: {}, DaysAgo: {})",
            seed + 1, savedDoc.getTitle(), viewCount, upvoteCount, daysAgo);
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
    List<User> users = targetEmails.stream()
            .map(email -> userRepository.findByEmail(email).orElse(null))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    if (users.isEmpty()) {
      log.warn("⚠️ Không tìm thấy User nào thuộc danh sách email yêu cầu. Bỏ qua việc tạo comment.");
      return;
    }

    log.info("Found {} users for commenting.", users.size());

    // 3. Tạo comment cho tất cả documents
    List<Document> allDocs = documentRepository.findAll();
    List<Comment> commentsToSave = new ArrayList<>();
    int userCursor = 0;

    for (Document doc : allDocs) {
      // Mỗi document có 2-10 comments tùy theo index
      int commentCount = 2 + (int) (Math.random() * 9);
      for (int i = 0; i < commentCount; i++) {
        User currentUser = users.get(userCursor % users.size());
        userCursor++;

        Comment comment = Comment.builder()
                .document(doc)
                .user(currentUser)
                .content("Bình luận tuyệt vời về: " + doc.getTitle() + ". Tài liệu này thực sự hữu ích và chuyên sâu. Cảm ơn tác giả đã chia sẻ kiến thức quý báu.")
                .isDeleted(false)
                .build();

        commentsToSave.add(comment);
      }
    }

    // 4. Lưu vào Database
    if (!commentsToSave.isEmpty()) {
      commentRepository.saveAll(commentsToSave);
      log.info("✅ Đã tạo thành công {} comments cho {} documents", commentsToSave.size(), allDocs.size());
    }
  }

  /**
   * Seed engagement data: views, votes cho documents để test trending feature
   */
  private void seedEngagementData() {
    List<Document> allDocs = documentRepository.findAll();
    log.info("📊 Seeding engagement data for {} documents", allDocs.size());

    for (int i = 0; i < allDocs.size(); i++) {
      Document doc = allDocs.get(i);

      // Tính toán engagement based on position
      // Documents đầu tiên có engagement cao, documents sau có ít hơn
      int position = i;
      int views = (20 - position) * 100 + (int) (Math.random() * 500);
      int upvotes = Math.max(0, (15 - position) * 5 + (int) (Math.random() * 20));
      int downvotes = Math.max(0, (position - 8) * 2);
      int voteScore = upvotes - downvotes;

      doc.setViewCount(Math.max(0, views));
      doc.setUpvoteCount(Math.max(0, upvotes));
      doc.setVoteScore(voteScore);

      // Set createdAt để mô phỏng các documents gần đây
      int daysAgo = i % 8; // Xoay vòng giữa 0-7 ngày
      doc.setCreatedAt(Instant.now().minusSeconds(daysAgo * 24 * 60 * 60L));

      documentRepository.save(doc);
      log.debug("  ✓ Doc #{}: {} - Views: {}, Upvotes: {}, VoteScore: {}",
              i + 1, doc.getTitle(), views, upvotes, voteScore);
    }

    log.info("✅ Engagement data seeding completed!");
  }
}