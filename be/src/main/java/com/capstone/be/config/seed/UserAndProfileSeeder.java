package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.ReviewerDomainLink;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.ReviewerSpecLink;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.EducationLevel;
import com.capstone.be.domain.enums.OrgType;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Profile("dev")
@Component("userAndProfileSeeder")
@RequiredArgsConstructor
@Slf4j
public class UserAndProfileSeeder {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final ReviewerDomainLinkRepository reviewerDomainLinkRepository;
  private final ReviewerSpecLinkRepository reviewerSpecLinkRepository;
  private final DomainRepository domainRepository;
  private final SpecializationRepository specializationRepository;
  private final PasswordEncoder passwordEncoder;

  private final ApplicationEventPublisher eventPublisher;

  // Password for all user
  private static final String DEFAULT_PASSWORD = "aa123123";

  // Starting seed values for UUID generation
  private static final int SEED_SYSTEM_ADMIN_START = 1000000;
  private static final int SEED_BUSINESS_ADMIN_START = 2000000;
  private static final int SEED_READER_START = 3000000;
  private static final int SEED_REVIEWER_START = 4000000;
  private static final int SEED_ORGANIZATION_START = 5000000;

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

    // Seed Organizations
    seedOrganizations();

    eventPublisher.publishEvent(new UserSeededEvent());
    log.info("User seeding completed successfully!");
  }

  private void seedSystemAdmins() {
    createUser(SEED_SYSTEM_ADMIN_START, "admin@capstone.com", "Admin Hệ Thống",
        UserRole.SYSTEM_ADMIN, UserStatus.ACTIVE, null);
    log.info("Seeded 1 System Admin");
  }

  private void seedBusinessAdmins() {
    createUser(SEED_BUSINESS_ADMIN_START, "business1@capstone.com", "Nguyễn Văn An",
        UserRole.BUSINESS_ADMIN, UserStatus.ACTIVE, null);
    createUser(SEED_BUSINESS_ADMIN_START + 1, "business2@capstone.com", "Trần Thị Bình",
        UserRole.BUSINESS_ADMIN, UserStatus.ACTIVE, null);
    log.info("Seeded 2 Business Admins");
  }

  private void seedReaders() {
    int seed = SEED_READER_START;

    // Active readers
    createReaderUser(seed++, "reader1@gmail.com", "Phạm Minh Cường", UserStatus.ACTIVE,
        LocalDate.of(1998, 5, 15));
    createReaderUser(seed++, "reader2@gmail.com", "Lê Thu Hà", UserStatus.ACTIVE,
        LocalDate.of(1999, 8, 20));
    createReaderUser(seed++, "reader3@gmail.com", "Hoàng Văn Đức", UserStatus.ACTIVE,
        LocalDate.of(2000, 3, 10));
    createReaderUser(seed++, "reader4@gmail.com", "Vũ Thị Mai", UserStatus.ACTIVE,
        LocalDate.of(1997, 12, 5));
    createReaderUser(seed++, "reader5@gmail.com", "Đỗ Quang Huy", UserStatus.ACTIVE,
        LocalDate.of(2001, 7, 25));

    // Pending email verification
    createReaderUser(seed++, "reader.pending@gmail.com", "Ngô Thị Lan",
        UserStatus.PENDING_EMAIL_VERIFY,
        LocalDate.of(1999, 4, 18));

    log.info("Seeded 6 Readers (5 active, 1 pending email)");
  }

  private void seedReviewers(List<Domain> allDomains, List<Specialization> allSpecs) {
    int seed = SEED_REVIEWER_START;

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
        seed++, "reviewer1@gmail.com", "TS. Bùi Văn Thành", UserStatus.ACTIVE,
        LocalDate.of(1985, 3, 20), "0000-0001-2345-6789",
        EducationLevel.DOCTORATE, "Đại học Bách Khoa Hà Nội", "thanh.bui@hust.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/thanh-cv.pdf"),
        List.of(itDomain), itSpecs
    );

    createReviewerUser(
        seed++, "reviewer2@gmail.com", "PGS. Lương Thị Hương", UserStatus.ACTIVE,
        LocalDate.of(1980, 7, 15), "0000-0002-3456-7890",
        EducationLevel.DOCTORATE, "Đại học Quốc Gia TP.HCM", "huong.luong@vnu.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/huong-cv.pdf"),
        List.of(engineeringDomain), engSpecs
    );

    createReviewerUser(
        seed++, "reviewer3@gmail.com", "TS. Đặng Minh Tuấn", UserStatus.ACTIVE,
        LocalDate.of(1988, 11, 8), "0000-0003-4567-8901",
        EducationLevel.DOCTORATE, "Viện Khoa học Công nghệ", "tuan.dang@vast.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/tuan-cv.pdf",
            "https://s3.amazonaws.com/reviewer-credentials/tuan-cert.pdf"),
        List.of(itDomain, engineeringDomain), itSpecs
    );

    // Pending approval reviewers
    createReviewerUser(
        seed++, "reviewer.pending1@gmail.com", "ThS. Trịnh Văn Long", UserStatus.PENDING_APPROVE,
        LocalDate.of(1990, 5, 12), "0000-0004-5678-9012",
        EducationLevel.MASTER, "Đại học Y Hà Nội", "long.trinh@hmu.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/long-cv.pdf"),
        List.of(healthDomain), healthSpecs
    );

    createReviewerUser(
        seed++, "reviewer.pending2@gmail.com", "TS. Phan Thị Nga", UserStatus.PENDING_APPROVE,
        LocalDate.of(1987, 9, 25), "0000-0005-6789-0123",
        EducationLevel.DOCTORATE, "Đại học Khoa học Tự nhiên", "nga.phan@hus.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/nga-cv.pdf"),
        List.of(itDomain), itSpecs
    );

    // Pending email verification
    createReviewerUser(
        seed++, "reviewer.email@gmail.com", "ThS. Võ Quang Nam", UserStatus.PENDING_EMAIL_VERIFY,
        LocalDate.of(1992, 2, 18), "0000-0006-7890-1234",
        EducationLevel.MASTER, "Đại học Công nghệ", "nam.vo@hutech.edu.vn",
        List.of("https://s3.amazonaws.com/reviewer-credentials/nam-cv.pdf"),
        List.of(engineeringDomain), engSpecs
    );

    // Rejected reviewer
    createReviewerUser(
        seed++, "reviewer.rejected@gmail.com", "Nguyễn Văn Bình", UserStatus.REJECTED,
        LocalDate.of(1995, 6, 30), "0000-0007-8901-2345",
        EducationLevel.UNIVERSITY, "Công ty ABC", "binh.nguyen@abc.com",
        List.of("https://s3.amazonaws.com/reviewer-credentials/binh-cv.pdf"),
        List.of(itDomain), itSpecs
    );

    log.info(
        "Seeded 7 Reviewers (3 active, 2 pending approval, 1 pending email, 1 rejected)");
  }

  private void seedOrganizations() {
    int seed = SEED_ORGANIZATION_START;

    // Active organizations
    createOrganizationUser(
        seed++, "org1.admin@hust.edu.vn", "Nguyễn Văn Tuấn", UserStatus.ACTIVE,
        "Đại học Bách Khoa Hà Nội", OrgType.UNIVERSITY,
        "contact@hust.edu.vn", "024-3869-2008",
        "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
        "0100101968",
        "https://s3.amazonaws.com/organization-logos/hust-logo.png"
    );

    createOrganizationUser(
        seed++, "org2.admin@uit.edu.vn", "Trần Thị Hương", UserStatus.ACTIVE,
        "Đại học Công nghệ Thông tin - ĐHQG TP.HCM", OrgType.UNIVERSITY,
        "info@uit.edu.vn", "028-3725-2002",
        "Khu phố 6, P.Linh Trung, TP.Thủ Đức, TP.HCM",
        "0304012363",
        "https://s3.amazonaws.com/organization-logos/uit-logo.png"
    );

    // Pending approval organization
    createOrganizationUser(
        seed++, "org.pending@fpt.edu.vn", "Lê Minh Quân", UserStatus.PENDING_APPROVE,
        "Trường Đại học FPT", OrgType.UNIVERSITY,
        "admission@fpt.edu.vn", "024-7300-5588",
        "Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Hà Nội",
        "0101388139",
        null
    );

    // Pending email verification
    createOrganizationUser(
        seed++, "org.email@vnu.edu.vn", "Phạm Văn Long", UserStatus.PENDING_EMAIL_VERIFY,
        "Đại học Quốc gia Hà Nội", OrgType.UNIVERSITY,
        "vnu@vnu.edu.vn", "024-3554-4338",
        "144 Xuân Thủy, Cầu Giấy, Hà Nội",
        "0100104659",
        "https://s3.amazonaws.com/organization-logos/vnu-logo.png"
    );

    // Rejected organization
    createOrganizationUser(
        seed++, "org.rejected@abc.edu.vn", "Hoàng Văn Nam", UserStatus.REJECTED,
        "Trung tâm Đào tạo ABC", OrgType.TRAINING_CENTER,
        "contact@abc.edu.vn", "024-1234-5678",
        "123 Đường ABC, Quận XYZ, Hà Nội",
        "0123456789",
        null
    );

    log.info(
        "Seeded 5 Organizations (2 active, 1 pending approval, 1 pending email, 1 rejected)");
  }

  private void createUser(int seed, String email, String fullName, UserRole role,
      UserStatus status, LocalDate dob) {
    User user = User.builder()
        .id(SeedUtil.generateUUID(seed))
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(role)
        .status(status)
        .point(0)
        .build();

    userRepository.save(user);
  }

  private void createReaderUser(int seed, String email, String fullName, UserStatus status,
      LocalDate dob) {
    User user = User.builder()
        .id(SeedUtil.generateUUID(seed))
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(UserRole.READER)
        .status(status)
        .point(0)
        .build();

    user = userRepository.save(user);

    ReaderProfile profile = ReaderProfile.builder()
        .id(SeedUtil.generateUUID(seed + 100000)) // Offset for profile IDs
        .user(user)
        .dob(dob)
        .build();

    readerProfileRepository.save(profile);
  }

  private void createReviewerUser(int seed, String email, String fullName, UserStatus status,
      LocalDate dob, String orcid, EducationLevel educationLevel, String orgName, String orgEmail,
      List<String> credentialUrls, List<Domain> domains, List<Specialization> specializations) {

    User user = User.builder()
        .id(SeedUtil.generateUUID(seed))
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(UserRole.REVIEWER)
        .status(status)
        .point(0)
        .build();

    user = userRepository.save(user);

    ReviewerProfile profile = ReviewerProfile.builder()
        .id(SeedUtil.generateUUID(seed + 100000)) // Offset for profile IDs
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
    int linkSeed = seed + 200000; // Offset for link IDs
    for (Domain domain : domains) {
      ReviewerDomainLink link = ReviewerDomainLink.builder()
          .id(SeedUtil.generateUUID(linkSeed++))
          .reviewer(profile)
          .domain(domain)
          .build();
      reviewerDomainLinkRepository.save(link);
    }

    // Create specialization links
    linkSeed = seed + 300000; // Offset for spec link IDs
    for (Specialization spec : specializations) {
      ReviewerSpecLink link = ReviewerSpecLink.builder()
          .id(SeedUtil.generateUUID(linkSeed++))
          .reviewer(profile)
          .specialization(spec)
          .build();
      reviewerSpecLinkRepository.save(link);
    }
  }

  private void createOrganizationUser(int seed, String adminEmail, String adminFullName,
      UserStatus status, String orgName, OrgType orgType, String orgEmail, String hotline,
      String address, String registrationNumber, String logoUrl) {

    User admin = User.builder()
        .id(SeedUtil.generateUUID(seed))
        .email(adminEmail)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(adminFullName)
        .role(UserRole.ORGANIZATION_ADMIN)
        .status(status)
        .point(0)
        .build();

    admin = userRepository.save(admin);

    OrganizationProfile organizationProfile = OrganizationProfile.builder()
        .id(SeedUtil.generateUUID(seed + 100000)) // Offset for profile IDs
        .admin(admin)
        .name(orgName)
        .type(orgType)
        .email(orgEmail)
        .hotline(hotline)
        .address(address)
        .registrationNumber(registrationNumber)
        .logo(logoUrl)
        .build();

    organizationProfileRepository.save(organizationProfile);
  }
}
