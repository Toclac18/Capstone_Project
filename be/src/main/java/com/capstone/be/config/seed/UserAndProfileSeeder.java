package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.ReviewerDomainLink;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.ReviewerSpecLink;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.EducationLevel;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewerDomainLinkRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.ReviewerSpecLinkRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.UserRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class UserAndProfileSeeder {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final ReviewerDomainLinkRepository reviewerDomainLinkRepository;
  private final ReviewerSpecLinkRepository reviewerSpecLinkRepository;
  private final DomainRepository domainRepository;
  private final SpecializationRepository specializationRepository;
  private final PasswordEncoder passwordEncoder;

  // Password for all user
  private static final String DEFAULT_PASSWORD = "aa123123";

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    if (userRepository.count() > 0) {
      log.warn("Users already exist → skip seeding.");
      return;
    }

    log.info("Starting user seeding...");

    // Get domains and specializations for reviewers
    List<Domain> allDomains = domainRepository.findAll();
    List<Specialization> allSpecs = specializationRepository.findAll();

    if (allDomains.isEmpty() || allSpecs.isEmpty()) {
      log.warn("No domains/specializations found. Run DomainAndSpecializationSeeder first.");
      return;
    }

    // Seed System Admins
    seedSystemAdmins();

    // Seed Business Admins
    seedBusinessAdmins();

    // Seed Readers
    seedReaders();

    // Seed Reviewers (with domains and specializations)
    seedReviewers(allDomains, allSpecs);

    log.info("User seeding completed successfully!");
  }

  private void seedSystemAdmins() {
    createUser("admin@capstone.com", "Admin Hệ Thống", UserRole.SYSTEM_ADMIN, UserStatus.ACTIVE,
        null);
    log.info("Seeded 1 System Admin");
  }

  private void seedBusinessAdmins() {
    createUser("business1@capstone.com", "Nguyễn Văn An", UserRole.BUSINESS_ADMIN,
        UserStatus.ACTIVE, null);
    createUser("business2@capstone.com", "Trần Thị Bình", UserRole.BUSINESS_ADMIN,
        UserStatus.ACTIVE, null);
    log.info("Seeded 2 Business Admins");
  }

  private void seedReaders() {
    // Active readers
    createReaderUser("reader1@gmail.com", "Phạm Minh Cường", UserStatus.ACTIVE,
        LocalDate.of(1998, 5, 15));
    createReaderUser("reader2@gmail.com", "Lê Thu Hà", UserStatus.ACTIVE,
        LocalDate.of(1999, 8, 20));
    createReaderUser("reader3@gmail.com", "Hoàng Văn Đức", UserStatus.ACTIVE,
        LocalDate.of(2000, 3, 10));
    createReaderUser("reader4@gmail.com", "Vũ Thị Mai", UserStatus.ACTIVE,
        LocalDate.of(1997, 12, 5));
    createReaderUser("reader5@gmail.com", "Đỗ Quang Huy", UserStatus.ACTIVE,
        LocalDate.of(2001, 7, 25));

    // Pending email verification
    createReaderUser("reader.pending@gmail.com", "Ngô Thị Lan", UserStatus.PENDING_EMAIL_VERIFY,
        LocalDate.of(1999, 4, 18));

    log.info("Seeded 6 Readers (5 active, 1 pending email)");
  }

  private void seedReviewers(List<Domain> allDomains, List<Specialization> allSpecs) {
    // Get specific domains
    Domain itDomain = allDomains.stream()
        .filter(d -> d.getName().contains("INFORMATION TECHNOLOGY"))
        .findFirst().orElse(allDomains.get(0));

    Domain engineeringDomain = allDomains.stream()
        .filter(d -> d.getName().contains("ENGINEERING"))
        .findFirst().orElse(allDomains.get(1));

    Domain healthDomain = allDomains.stream()
        .filter(d -> d.getName().contains("HEALTH"))
        .findFirst().orElse(allDomains.get(2));

    // Get some specializations
    List<Specialization> itSpecs = allSpecs.stream()
        .filter(s -> s.getDomain().getId().equals(itDomain.getId()))
        .limit(3)
        .toList();

    List<Specialization> engSpecs = allSpecs.stream()
        .filter(s -> s.getDomain().getId().equals(engineeringDomain.getId()))
        .limit(3)
        .toList();

    List<Specialization> healthSpecs = allSpecs.stream()
        .filter(s -> s.getDomain().getId().equals(healthDomain.getId()))
        .limit(2)
        .toList();

    // Active reviewers
    createReviewerUser(
        "reviewer1@gmail.com", "TS. Bùi Văn Thành", UserStatus.ACTIVE,
        LocalDate.of(1985, 3, 20), "0000-0001-2345-6789",
        EducationLevel.DOCTORATE, "Đại học Bách Khoa Hà Nội", "thanh.bui@hust.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/thanh-cv.pdf"),
        List.of(itDomain), itSpecs
    );

    createReviewerUser(
        "reviewer2@gmail.com", "PGS. Lương Thị Hương", UserStatus.ACTIVE,
        LocalDate.of(1980, 7, 15), "0000-0002-3456-7890",
        EducationLevel.DOCTORATE, "Đại học Quốc Gia TP.HCM", "huong.luong@vnu.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/huong-cv.pdf"),
        List.of(engineeringDomain), engSpecs
    );

    createReviewerUser(
        "reviewer3@gmail.com", "TS. Đặng Minh Tuấn", UserStatus.ACTIVE,
        LocalDate.of(1988, 11, 8), "0000-0003-4567-8901",
        EducationLevel.DOCTORATE, "Viện Khoa học Công nghệ", "tuan.dang@vast.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/tuan-cv.pdf",
            "https://s3.amazonaws.com/reviewer-credentials/tuan-cert.pdf"),
        List.of(itDomain, engineeringDomain), itSpecs
    );

    // Pending approval reviewers
    createReviewerUser(
        "reviewer.pending1@gmail.com", "ThS. Trịnh Văn Long", UserStatus.PENDING_APPROVE,
        LocalDate.of(1990, 5, 12), "0000-0004-5678-9012",
        EducationLevel.MASTER, "Đại học Y Hà Nội", "long.trinh@hmu.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/long-cv.pdf"),
        List.of(healthDomain), healthSpecs
    );

    createReviewerUser(
        "reviewer.pending2@gmail.com", "TS. Phan Thị Nga", UserStatus.PENDING_APPROVE,
        LocalDate.of(1987, 9, 25), "0000-0005-6789-0123",
        EducationLevel.DOCTORATE, "Đại học Khoa học Tự nhiên", "nga.phan@hus.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/nga-cv.pdf"),
        List.of(itDomain), itSpecs
    );

    // Pending email verification
    createReviewerUser(
        "reviewer.email@gmail.com", "ThS. Võ Quang Nam", UserStatus.PENDING_EMAIL_VERIFY,
        LocalDate.of(1992, 2, 18), "0000-0006-7890-1234",
        EducationLevel.MASTER, "Đại học Công nghệ", "nam.vo@hutech.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/nam-cv.pdf"),
        List.of(engineeringDomain), engSpecs
    );

    // Rejected reviewer
    createReviewerUser(
        "reviewer.rejected@gmail.com", "Nguyễn Văn Bình", UserStatus.REJECTED,
        LocalDate.of(1995, 6, 30), "0000-0007-8901-2345",
        EducationLevel.UNIVERSITY, "Công ty ABC", "binh.nguyen@abc.com",
        List.of("https://s3.amazonaws.com/reviewer-credentials/binh-cv.pdf"),
        List.of(itDomain), itSpecs
    );

    log.info(
        "Seeded 7 Reviewers (3 active, 2 pending approval, 1 pending email, 1 rejected)");
  }

  private void createUser(String email, String fullName, UserRole role, UserStatus status,
      LocalDate dob) {
    User user = User.builder()
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(role)
        .status(status)
        .point(0)
        .build();

    userRepository.save(user);
  }

  private void createReaderUser(String email, String fullName, UserStatus status, LocalDate dob) {
    User user = User.builder()
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(UserRole.READER)
        .status(status)
        .point(0)
        .build();

    user = userRepository.save(user);

    ReaderProfile profile = ReaderProfile.builder()
        .user(user)
        .dob(dob)
        .build();

    readerProfileRepository.save(profile);
  }

  private void createReviewerUser(String email, String fullName, UserStatus status, LocalDate dob,
      String orcid, EducationLevel educationLevel, String orgName, String orgEmail,
      List<String> credentialUrls, List<Domain> domains, List<Specialization> specializations) {

    User user = User.builder()
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(UserRole.REVIEWER)
        .status(status)
        .point(0)
        .build();

    user = userRepository.save(user);

    ReviewerProfile profile = ReviewerProfile.builder()
        .user(user)
        .dateOfBirth(dob)
        .ordid(orcid)
        .educationLevel(educationLevel)
        .organizationName(orgName)
        .organizationEmail(orgEmail)
        .credentialFileUrls(new ArrayList<>(credentialUrls))
        .build();

    profile = reviewerProfileRepository.save(profile);

    // Create domain links
    for (Domain domain : domains) {
      ReviewerDomainLink link = ReviewerDomainLink.builder()
          .reviewer(profile)
          .domain(domain)
          .build();
      reviewerDomainLinkRepository.save(link);
    }

    // Create specialization links
    for (Specialization spec : specializations) {
      ReviewerSpecLink link = ReviewerSpecLink.builder()
          .reviewer(profile)
          .specialization(spec)
          .build();
      reviewerSpecLinkRepository.save(link);
    }
  }
}
