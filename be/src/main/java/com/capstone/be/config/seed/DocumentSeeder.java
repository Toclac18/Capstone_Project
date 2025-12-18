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
 * 
 * Document Status Flow:
 * - Free documents: PENDING → AI_MODERATION → ACTIVE (no review needed)
 * - Premium documents: PENDING → AI_MODERATION → PENDING_REVIEW → REVIEWING → PENDING_APPROVE → ACTIVE/REJECTED
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

    // 1. Tạo 30 documents với các status khác nhau
    for (int i = 0; i < 30; i++) {
      createDocument(i);
    }

    // 2. Sau khi tạo xong Document thì tạo luôn History
    seedReadHistory();

    // 3. Tạo comment cho docs (chỉ cho ACTIVE docs)
    genCommentForDocument();

    // 4. Tạo engagement data (views, votes) cho ACTIVE docs
    seedEngagementData();

    eventPublisher.publishEvent(new DocumentSeededEvent());
  }

  private void createDocument(int seed) {
    OrganizationProfile orgProfile =
            organizationProfileRepository.findByEmail("contact@hust.edu.vn").orElse(null);

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

    DocumentSummarization summarization = DocumentSummarization.builder()
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
            "Blockchain và Smart Contracts",
            "DevOps Best Practices",
            "System Design Interview",
            "Clean Code Principles",
            "Design Patterns in Java",
            "Agile Project Management",
            "Data Structures Advanced",
            "Computer Vision Basics",
            "Natural Language Processing",
            "Distributed Systems",
            "Software Architecture"
    };
    String title = seed < titles.length ? titles[seed] : "Tài liệu tham khảo " + seed;

    // Document distribution (30 docs total):
    // - INTERNAL (org docs): seed 0-7 (8 docs) - NOT premium, has orgId
    // - PUBLIC free: seed 8-15 (8 docs) - NOT premium, no orgId
    // - PUBLIC premium: seed 16-29 (14 docs) - premium, no orgId
    
    boolean isInternal = seed < 8;
    boolean isPremium = seed >= 16; // Only PUBLIC docs can be premium
    DocVisibility visibility = isInternal ? DocVisibility.INTERNAL : DocVisibility.PUBLIC;
    OrganizationProfile docOrg = isInternal ? orgProfile : null; // Only INTERNAL docs have org
    
    DocStatus status = determineDocumentStatus(seed, isPremium, isInternal);
    
    // Only ACTIVE documents have engagement data
    int viewCount = 0;
    int upvoteCount = 0;
    int voteScore = 0;
    int daysAgo = 7;
    
    if (status == DocStatus.ACTIVE) {
      daysAgo = Math.max(0, 7 - (seed % 8));
      viewCount = (30 - seed) * 50;
      upvoteCount = Math.max(0, (20 - seed) * 3);
      int downvoteCount = Math.max(0, (seed - 15) * 2);
      voteScore = upvoteCount - downvoteCount;
    }

    Document document = Document.builder()
            .id(SeedUtil.generateUUID("doc-" + seed))
            .title(title)
            .description("Mô tả chi tiết cho " + title + ". Quyển sách này rất hữu ích cho sinh viên và những người muốn học tập. Đây là tài liệu chất lượng cao được biên soạn bởi các chuyên gia trong ngành.")
            .uploader(user)
            .organization(docOrg)
            .visibility(visibility)
            .docType(docType)
            .isPremium(isPremium)
            .price(isPremium ? 100 : 0)
            .thumbnailKey("/thumbnail-" + (seed % 5 + 1) + ".jpg")
            .fileKey("file-" + (seed + 1) + ".pdf")
            .pageCount(20 + (seed * 5))
            .status(status)
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

    log.info("✅ Created document #{}: {} (Visibility: {}, Premium: {}, Status: {}, Org: {})",
            seed + 1, savedDoc.getTitle(), visibility, isPremium, status, 
            docOrg != null ? docOrg.getName() : "none");
  }

  /**
   * Determine document status based on seed, premium flag, and visibility
   * 
   * Distribution for 30 documents:
   * - INTERNAL docs (seed 0-7): 6 ACTIVE, 2 INACTIVE (for org management testing)
   * - PUBLIC free docs (seed 8-15): All ACTIVE
   * - PUBLIC premium docs (seed 16-29): Various statuses
   *   - 2 PENDING_REVIEW (waiting for reviewer assignment)
   *   - 2 REVIEWING (reviewer accepted, working on review)
   *   - 2 PENDING_APPROVE (reviewer submitted, waiting BA approval)
   *   - 6 ACTIVE (review approved)
   *   - 2 REJECTED (review rejected)
   */
  private DocStatus determineDocumentStatus(int seed, boolean isPremium, boolean isInternal) {
    // INTERNAL documents (org docs)
    if (isInternal) {
      // seed 0-5: ACTIVE, seed 6-7: INACTIVE (for testing activate/deactivate)
      return seed < 6 ? DocStatus.ACTIVE : DocStatus.INACTIVE;
    }
    
    // PUBLIC free documents - always ACTIVE
    if (!isPremium) {
      return DocStatus.ACTIVE;
    }
    
    // PUBLIC premium documents (seed 16-29)
    int premiumIdx = seed - 16; // 0-13
    
    DocStatus status;
    if (premiumIdx < 2) {
      status = DocStatus.PENDING_REVIEW; // 2 docs waiting for reviewer
    } else if (premiumIdx < 4) {
      status = DocStatus.REVIEWING; // 2 docs being reviewed
    } else if (premiumIdx < 6) {
      status = DocStatus.PENDING_APPROVE; // 2 docs waiting BA approval
    } else if (premiumIdx < 12) {
      status = DocStatus.ACTIVE; // 6 docs approved
    } else {
      status = DocStatus.REJECTED; // 2 docs rejected
    }
    
    log.debug("Premium doc seed={}, premiumIdx={}, status={}", seed, premiumIdx, status);
    return status;
  }

  /**
   * Logic tạo lịch sử đọc cho user reader1 (chỉ cho ACTIVE docs)
   */
  private void seedReadHistory() {
    if (documentReadHistoryRepository.count() > 0) {
      log.warn("History already exists → skip.");
      return;
    }

    User reader = userRepository.findByEmail("reader1@gmail.com").orElse(null);
    if (reader == null) return;

    List<Document> activeDocuments = documentRepository.findAll().stream()
            .filter(d -> d.getStatus() == DocStatus.ACTIVE)
            .toList();

    for (int i = 0; i < activeDocuments.size(); i++) {
      Document doc = activeDocuments.get(i);

      DocumentReadHistory history = DocumentReadHistory.builder()
              .id(SeedUtil.generateUUID("history-" + i))
              .user(reader)
              .document(doc)
              .build();

      documentReadHistoryRepository.save(history);
      log.info("\uD83D\uDCD6 Created history: User read " + doc.getTitle());
    }
  }

  private void genCommentForDocument() {
    List<String> targetEmails = List.of(
            "reader1@gmail.com",
            "reader2@gmail.com",
            "reader3@gmail.com",
            "reader4@gmail.com",
            "reader5@gmail.com",
            "reader.pending@gmail.com"
    );

    List<User> users = targetEmails.stream()
            .map(email -> userRepository.findByEmail(email).orElse(null))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    if (users.isEmpty()) {
      log.warn("⚠️ Không tìm thấy User nào thuộc danh sách email yêu cầu. Bỏ qua việc tạo comment.");
      return;
    }

    log.info("Found {} users for commenting.", users.size());

    // Chỉ tạo comment cho ACTIVE documents
    List<Document> activeDocs = documentRepository.findAll().stream()
            .filter(d -> d.getStatus() == DocStatus.ACTIVE)
            .toList();
    
    List<Comment> commentsToSave = new ArrayList<>();
    int userCursor = 0;

    for (Document doc : activeDocs) {
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

    if (!commentsToSave.isEmpty()) {
      commentRepository.saveAll(commentsToSave);
      log.info("✅ Đã tạo thành công {} comments cho {} ACTIVE documents", commentsToSave.size(), activeDocs.size());
    }
  }

  /**
   * Seed engagement data cho ACTIVE documents
   */
  private void seedEngagementData() {
    List<Document> activeDocs = documentRepository.findAll().stream()
            .filter(d -> d.getStatus() == DocStatus.ACTIVE)
            .toList();
    
    log.info("📊 Seeding engagement data for {} ACTIVE documents", activeDocs.size());

    for (int i = 0; i < activeDocs.size(); i++) {
      Document doc = activeDocs.get(i);

      int position = i;
      int views = (20 - position) * 100 + (int) (Math.random() * 500);
      int upvotes = Math.max(0, (15 - position) * 5 + (int) (Math.random() * 20));
      int downvotes = Math.max(0, (position - 8) * 2);
      int voteScore = upvotes - downvotes;

      doc.setViewCount(Math.max(0, views));
      doc.setUpvoteCount(Math.max(0, upvotes));
      doc.setVoteScore(voteScore);

      int daysAgo = i % 8;
      doc.setCreatedAt(Instant.now().minusSeconds(daysAgo * 24 * 60 * 60L));

      documentRepository.save(doc);
      log.debug("  ✓ Doc #{}: {} - Views: {}, Upvotes: {}, VoteScore: {}",
              i + 1, doc.getTitle(), views, upvotes, voteScore);
    }

    log.info("✅ Engagement data seeding completed!");
  }
}
