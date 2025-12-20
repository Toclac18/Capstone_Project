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

    eventPublisher.publishEvent(new DocumentSeededEvent());
  }

  private void seedDocumentsData() {
    List<String> docTitles = List.of(
        "Foundations of Modern Mathematics",
        "Introduction to Computer Science",
        "Principles of Micro and Macroeconomics",
        "Basics of Machine Learning",
        "Effective Communication Skills",
        "Critical Thinking and Problem Solving",
        "Introduction to Psychology",
        "Data Analysis for Business Decisions",
        "Fundamentals of Financial Accounting",
        "Environmental Science and Sustainability",
        "Project Management Essentials",
        "Digital Marketing Strategies",
        "Entrepreneurship and Startup Fundamentals",
        "Leadership and Team Management",
        "Human Resource Management Basics",
        "Introduction to Sociology",
        "Research Methods in Social Sciences",
        "Creative Thinking and Innovation",
        "Ethics in the Modern World",
        "Public Speaking and Presentation Skills",
        "Global Business and International Trade",
        "Introduction to Artificial Intelligence",
        "Statistics for Data Science",
        "Supply Chain Management Fundamentals",
        "Health, Nutrition, and Wellness",
        "Educational Psychology",
        "Media and Communication Studies",
        "Philosophy: An Introduction",
        "Time Management and Productivity",
        "Cultural Studies in a Globalized World", // 30-th
        "Introduction to Political Science",
        "Behavioral Economics Explained",
        "Climate Change and Global Challenges",
        "History of Modern Civilization",
        "Fundamentals of Biotechnology",
        "Creative Writing Techniques",
        "International Relations and Diplomacy",
        "Basics of Law and Legal Systems",
        "Urban Planning and Smart Cities",
        "Science, Technology, and Society");


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

    int n = docTitles.size();
    int internalDocCount = 10; //need smaller than n

    // Part 1: Public Doc
    for (int i = 0; i < n-internalDocCount; i++) {

      Document document = buildDocument(i, docTitles, activeReaders, docTypes, specs);
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

    for (int i = n - internalDocCount ; i < n ; i++){
      Document doc = buildDocument(i, docTitles,
          activeReaders, docTypes, specs );
      doc.setOrganization(orgProfile);
      doc.setVisibility(DocVisibility.INTERNAL);
      documentRepository.save(doc);

      // #TODO: comment, vote...
    }

  }

  private Document buildDocument(int seed, List<String> docTitles,
      List<User> activeReaders, List<DocType> docTypes,
      List<Specialization> specs){
    UUID docId = SeedUtil.generateUUID("doc-" + seed);
    String title = docTitles.get(seed);
    String description = title
        + " is a very useful document for learning about Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.";

    User uploader = activeReaders.get(seed % activeReaders.size());

    DocVisibility visibility = DocVisibility.PUBLIC;

    DocType docType = docTypes.get(seed % docTypes.size());

    boolean isPremium = seed % 2 == 1 ;

    int price = isPremium ? 100 : 0;

    String thumnailKey = String.format("_sample_thumb_%d.png", (seed % 30) + 1);

    String fileKey = String.format("_sample_doc_%d.pdf", (seed % 30) + 1);

    int pageCount = 1 + myRandom(10, seed);

    DocStatus status = seed % 5 > 0 ? DocStatus.ACTIVE : DocStatus.AI_REJECTED;

    Specialization spec = specs.get(seed % specs.size());

    DocumentSummarization summarization = DocumentSummarization.builder()
        .shortSummary(
            title + "is about Lorem ipsum dolor sit amet. The content covers the main concepts.")
        .mediumSummary(
            "This document explores both theory and practice, providing an overview of the topic with concrete illustrative examples for document .")
        .detailedSummary(
            "This is a comprehensive analysis that connects classical methods with modern developments. The document clarifies assumptions, boundary conditions, and the statistical validity of the reported findings, while also proposing reproducible standards for document number .")
        .build();

    int viewCount = status == DocStatus.ACTIVE ? myRandom(999, seed) : 0;

    int upVoteCount = viewCount / 5 + myRandom(viewCount / 2, seed); //from 20% to 70% upvote
    int voteScore = upVoteCount / 5 * 3 + myRandom(upVoteCount / 5 * 2, seed);

    Instant createAt = Instant.now()
        .minus(1, ChronoUnit.DAYS)
        .minus(myRandom(30, seed), ChronoUnit.DAYS)
        .minus(myRandom(500, seed), ChronoUnit.MINUTES);

    return Document.builder()
        .id(docId).title(title)
        .description(description).uploader(uploader)
        .organization(null).visibility(visibility)
        .docType(docType).isPremium(isPremium)
        .price(price).thumbnailKey(thumnailKey)
        .fileKey(fileKey).pageCount(pageCount)
        .status(status).specialization(spec)
        .summarizations(summarization).viewCount(viewCount)
        .upvoteCount(upVoteCount).voteScore(voteScore)
        .createdAt(createAt)
        .build();
  }

  private int myRandom(int range, int seed) {
    if (range <= 0) {
      return 0;
    }
    int x = (seed + 100) * (seed + 100); //random *
    return x % range;
  }

}
