package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.DocumentSeededEvent;
import com.capstone.be.config.seed.event.TagSeededEvent;
import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

  private final DocumentVoteRepository documentVoteRepository;

  private final ReaderProfileRepository readerProfileRepository;

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


  private final String dummyText = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante.";

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
    seedDocumentsData();

//    for (int i = 0; i < 30; i++) {
//      createDocument(i);
//    }

    // 2. Sau khi tạo xong Document thì tạo luôn History
//    seedReadHistory();

    // 3. Tạo comment cho docs (chỉ cho ACTIVE docs)
//    genCommentForDocument();

    // 4. Tạo engagement data (views, votes) cho ACTIVE docs
//    seedEngagementData();

    eventPublisher.publishEvent(new DocumentSeededEvent());
  }

  private void seedDocumentsData() {
    String[] docTitles = {
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

    List<User> allUsers = userRepository.findAll();

    List<String> readerEmails = List.of("reader1@gmail.com", "reader2@gmail.com",
        "reader3@gmail.com");
    List<User> activeReaders = allUsers.stream()
        .filter(u -> readerEmails.contains(u.getEmail()))
        .limit(readerEmails.size()) //early stop
        .toList();

    String orgAdminEmail = "org1@gmail.com";
    User orgAdmin = allUsers.stream()
        .filter(u -> orgAdminEmail.equals(u.getEmail()))
        .findFirst().orElse(null);

    OrganizationProfile orgProfile = organizationProfileRepository
        .findByUserId(orgAdmin.getId()).orElse(null);

    List<DocType> docTypes = docTypeRepository.findAll().stream()
        .limit(5).toList();

    //find 5 specs (different domain)
    Set<UUID> existedDomain = new HashSet<>();
    List<Specialization> specs = new ArrayList<>();
    for (Specialization s : specializationRepository.findAll()) {
      if (existedDomain.add(s.getDomain().getId())) {
        specs.add(s);
      }
      if (specs.size() == 5) {
        break;
      }
    }

    int n = docTitles.length;
    for (int i = 0; i < n; i++) {

      UUID docId = SeedUtil.generateUUID("doc-" + i);
      String title = docTitles[i];
      String description = title
          + "is a very useful document for learning about Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.";

      User uploader = (i == 1) ? orgAdmin
          : activeReaders.get(i % activeReaders.size());

      DocVisibility visibility = DocVisibility.PUBLIC;

      DocType docType = docTypes.get(i % docTypes.size());

      boolean isPremium = i % 2 == 1;

      int price = isPremium ? 100 : 0;

      String thumnailKey = String.format("_sample_thumb_%d.png", (i % 5) + 1);

      String fileKey = String.format("_sample_doc_%d.pdf", (i % 5) + 1);

      int pageCount = 1 + myRandom(10, i);

      DocStatus status = i % 5 > 0 ? DocStatus.ACTIVE : DocStatus.AI_REJECTED;

      Specialization spec = specs.get(i % specs.size());

      DocumentSummarization summarization = DocumentSummarization.builder()
          .shortSummary(
              title + "is about Lorem ipsum dolor sit amet. The content covers the main concepts.")
          .mediumSummary(
              "This document explores both theory and practice, providing an overview of the topic with concrete illustrative examples for document .")
          .detailedSummary(
              "This is a comprehensive analysis that connects classical methods with modern developments. The document clarifies assumptions, boundary conditions, and the statistical validity of the reported findings, while also proposing reproducible standards for document number .")
          .build();

      int viewCount = status == DocStatus.ACTIVE ? myRandom(999, i) : 0;

      int upVoteCount = viewCount / 5 + myRandom(viewCount / 2, i); //from 20% to 70% upvote
      int voteScore = upVoteCount / 5 * 3 + myRandom(upVoteCount / 5 * 2, i);

      Instant createAt = Instant.now()
          .minus(1, ChronoUnit.DAYS)
          .minus(myRandom(30, 1), ChronoUnit.DAYS)
          .minus(myRandom(500, 1), ChronoUnit.MINUTES);

      Document document = Document.builder()
          .id(docId).title(title)
          .description(description).uploader(uploader)
          .organization(orgProfile).visibility(visibility)
          .docType(docType).isPremium(isPremium)
          .price(price).thumbnailKey(thumnailKey)
          .fileKey(fileKey).pageCount(pageCount)
          .status(status).specialization(spec)
          .summarizations(summarization).viewCount(viewCount)
          .upvoteCount(upVoteCount).voteScore(voteScore)
          .createdAt(createAt)
          .build();

      Document savedDocument = documentRepository.save(document);

      //Tag
      List<Tag> allTags = tagRepository.findAll().stream()
          .filter(tag -> tag.getStatus() == TagStatus.ACTIVE)
          .toList();

      int docTagCount = 2 + myRandom(3, i);  //2-4 tag each Doc
      for (int j = 0; j < docTagCount; j++) {
        int seed = i * 10 + j;  //random

        DocumentTagLink dtl = DocumentTagLink.builder()
            .document(savedDocument)
            .tag(allTags.get(myRandom(allTags.size(), seed)))
            .build();
        documentTagLinkRepository.save(dtl);
      }

      if (savedDocument.getStatus() != DocStatus.ACTIVE) {
        continue;
      }
      //else Create Comment, vote data

      //Comment: Each Document 0 , 5, 10,.. or 25 comment
      int commentCount = myRandom(6, i) * 5;
      for (int j = 0; j < commentCount; j++) {

        String content = "This document is " +
            dummyText.substring(myRandom(20, i * 10 + j)
                , 20 + myRandom(50, i * 10 + j));

        Comment comment = Comment.builder()
            .user(activeReaders.get(myRandom(activeReaders.size(), i * 10 + j)))
            .document(savedDocument)
            .content(content)
            .build();
        commentRepository.save(comment);
      }

      //Vote: real Vote Entity (note voteCount in document)
      int voteCount = myRandom(6, i);
      log.info(" VOTE {} FOR DOC {}", voteCount, i);

      Set<UUID> votedUserId = new HashSet<>();
      for (int j = 0; j < voteCount; j++) {

        User user = activeReaders.get(myRandom(activeReaders.size(), i * 10 + j));

        if (votedUserId.contains(user.getId())) {
          continue;
        }

        DocumentVote vote = DocumentVote.builder()
            .user(user)
            .document(savedDocument)
            .voteValue(myRandom(3, i * 10 + j) == 1 ? -1 : 1)
            .build();

        documentVoteRepository.save(vote);
        votedUserId.add(user.getId());
      }

    }

  }

  private int myRandom(int range, int seed) {
    if (range <= 0) {
      return 0;
    }
    int x = (seed + 100) * (seed + 100); //random *
    return x % range;
  }

}
