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

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    log.info("\uD83C\uDF31 Start seeding User and profile");
    if (userRepository.count() > 0) {
      eventPublisher.publishEvent(new UserSeededEvent());
      return;
    }

    // Seed System Admins
    seedSystemAdmins();

    // Seed Business Admins
    seedBusinessAdmins();

    // Seed Readers
    seedReaders();

    // Seed Reviewers (with domains and specializations)
    seedReviewers();

    // Seed Organizations
    seedOrganizations();

    eventPublisher.publishEvent(new UserSeededEvent());
    log.info("User seeding completed successfully!");
  }

  private void seedSystemAdmins() {
    createUser(0, "sadmin@gmail.com", "System Admin A",
        UserRole.SYSTEM_ADMIN, UserStatus.ACTIVE);
  }

  private void seedBusinessAdmins() {
    createUser(1, "badmin1@gmail.com", "Business Admin A",
        UserRole.BUSINESS_ADMIN, UserStatus.ACTIVE);
    createUser(2, "badmin2@gmail.com", "Business Admin B",
        UserRole.BUSINESS_ADMIN, UserStatus.ACTIVE);
  }

  private void seedReaders() {
    // Active readers
    List<String> names = List.of(
        "Nguyen Van An", "Tran Thi Bich", "Le Minh Chau", "Pham Quang Dung",
        "Hoang Thu Ha", "Vu Tuan Huy", "Do Thi Lan", "Bui Duc Long",
        "Dang Ngoc Mai", "Nguyen Thanh Nam", "Tran Hong Nhung", "Le Quoc Phong",
        "Pham Thi Quynh", "Hoang Minh Son", "Vu Thi Thao", "Do Van Thang",
        "Bui Ngoc Trang", "Dang Duc Trung", "Nguyen Thi Van", "Tran Minh Tuan",
        "Le Thu Yen", "Pham Huu Khang", "Hoang Thi Lien", "Vu Quang Minh",
        "Do Thu Phuong", "Bui Thanh Hai", "Dang Thi Hoa", "Nguyen Duc Hiep",
        "Tran Ngoc Khanh", "Le Van Khoa", "Pham Thi Mai", "Hoang Quoc Lam",
        "Vu Thi Nga", "Do Minh Phuc", "Bui Thu Giang", "Dang Van Huy",
        "Nguyen Thi Kim", "Tran Duc Manh", "Le Ngoc Nhi", "Pham Thanh Phuong",
        "Hoang Minh Quan", "Vu Van Sang", "Do Thi Thanh", "Bui Quoc Toan",
        "Dang Thu Trang", "Nguyen Minh Tri", "Tran Thi Yen", "Le Duc Anh",
        "Pham Ngoc Son"
    );

    int userCount = names.size();
    for (int i = 0; i < userCount; i++) {
      String email = "reader" + (i + 1) + "@gmail.com";
      LocalDate dob = LocalDate.ofEpochDay(10950 + (i + 100) * (i + 100) % 730); //2000 + random

      UserStatus status = UserStatus.ACTIVE;
      if (i >= userCount - 2) {
        status = UserStatus.PENDING_EMAIL_VERIFY;
      }

      createReaderUser(i + 1, email, names.get(i), status, dob);
    }

  }

  private void seedReviewers() {

    List<Domain> allDomains = domainRepository.findAll();
    List<Specialization> allSpecs = specializationRepository.findAll();

    if (allDomains.size() < 3) {
      log.info("(!) Domain is not seeded. please Check");
      return;
    }

    //Active Reviewer
    List<String> names = List.of(
        "TS. Nguyen Thanh An",
        "ThS. Vu Quoc Bao",
        "GS. Tran Duc Canh",
        "TS. Bui Thuy Dung",
        "ThS. Tran Quoc En",
        "TS. Dinh Duc Giang",
        "CN. Bui Thu Huong",
        "TS. Le Minh Hieu",
        "ThS. Pham Thi Khanh",
        "GS. Nguyen Van Long",
        "TS. Hoang Thu Mai",
        "ThS. Do Quang Nam",
        "TS. Vu Thi Phuong",
        "CN. Tran Minh Tuan",
        "TS. Nguyen Ngoc Anh",
        "ThS. Le Duc Thang",
        "GS. Pham Hong Son"
    );

    for (int i = 0; i < names.size(); i++) {

      List<Domain> domains = List.of(
          allDomains.get(i % allDomains.size()),
          allDomains.get((i + 1) % allDomains.size())); //2 domain

      List<Specialization> specs = new ArrayList<>();
      for (Domain d : domains) {
        List<Specialization> sp = allSpecs.stream()
            .filter(s -> s.getDomain().getId().equals(d.getId()))
            .limit(3)
            .toList();
        specs.addAll(sp);
      }

      String email = "reviewer" + i + "@gmail.com";

      LocalDate dob = LocalDate.ofEpochDay(7300 + (i + 100) * (i + 100) % 730);

      String orcid = i % 2 == 0 ? "ORCID-10000" + i : null;
      EducationLevel eduLevel = i % 3 == 0 ? EducationLevel.MASTER : EducationLevel.DOCTORATE;

      String orgName = "University" + (char) ('A' + i - 1);
      String orgEmail = orgName.toLowerCase() + "@gmail.com";
      List<String> credentials = List.of("_sample_review_credential_1.pdf");
      UserStatus status = UserStatus.ACTIVE;
      if (i == names.size() - 1) {
        status = UserStatus.REJECTED;
      }
      if (i == names.size() - 2) {
        status = UserStatus.PENDING_APPROVE;
      }
      if (i == names.size() - 3) {
        status = UserStatus.PENDING_EMAIL_VERIFY;
      }

      createReviewerUser(i, email, names.get(i), status,
          dob, orcid, eduLevel, orgName, orgEmail, credentials, domains, specs);
    }
  }

  private void seedOrganizations() {
    int seed = 0;

    createOrganizationUser(
        seed++, "org1@gmail.com",
        "Truong Gia Binh", UserStatus.ACTIVE,
        "FPT University", OrgType.UNIVERSITY,
        "info@fpt.edu.vn", "023-444-555",
        "Thon 3, Thach Hoa, Thach That, Ha Noi",
        "01927109257",
        null
    );

    createOrganizationUser(
        seed++, "org2@gmail.com",
        "Tran Thi Huong", UserStatus.ACTIVE,
        "Dai hoc Cong nghe Thong tin - DHQG TP.HCM", OrgType.UNIVERSITY,
        "info@uit.edu.vn", "028-3725-2002",
        "Khu pho 6, P.Linh Trung, TP.Thu Duc, TP.HCM",
        "0304012363",
        null
    );

    // Active organizations
    createOrganizationUser(
        seed++, "org3@gmail.com",
        "Nguyen Van Tuan", UserStatus.ACTIVE,
        "Dai hoc Bach Khoa Ha Noi", OrgType.UNIVERSITY,
        "contact@hust.edu.vn", "024-3869-2008",
        "So 1 Dai Co Viet, Hai Ba Trung, Ha Noi",
        "0100101968",
        null
    );

// Pending email verification
    createOrganizationUser(
        seed++, "org4@gmail.com",
        "Pham Van Long", UserStatus.PENDING_EMAIL_VERIFY,
        "Dai hoc Quoc gia Ha Noi", OrgType.UNIVERSITY,
        "vnu@vnu.edu.vn", "024-3554-4338",
        "144 Xuan Thuy, Cau Giay, Ha Noi",
        "0100104659",
        null
    );

// Rejected organization
    createOrganizationUser(
        seed++, "org5@gmail.com",
        "Hoang Van Nam", UserStatus.REJECTED,
        "Trung tam Dao tao ABC", OrgType.TRAINING_CENTER,
        "contact@abc.edu.vn", "024-1234-5678",
        "123 Duong ABC, Quan XYZ, Ha Noi",
        "0123456789",
        null
    );

    log.info(
        "Seeded 5 Organizations (2 active, 1 pending approval, 1 pending email, 1 rejected)");
  }

  private void createUser(int seed, String email, String fullName, UserRole role,
      UserStatus status) {
    User user = User.builder()
        .id(SeedUtil.generateUUID("user" + seed))
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(role)
        .status(status)
        .build();

    userRepository.save(user);
  }

  private void createReaderUser(int seed, String email, String fullName, UserStatus status,
      LocalDate dob) {
    User user = User.builder()
        .id(SeedUtil.generateUUID("user-reader-" + seed))
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(UserRole.READER)
        .status(status)
        .build();

    user = userRepository.save(user);

    ReaderProfile profile = ReaderProfile.builder()
        .id(SeedUtil.generateUUID("reader-profile-" + seed))
        .user(user)
        .point(seed == 1 ? 1000 : 100)
        .dob(dob)
        .build();

    readerProfileRepository.save(profile);
  }

  private void createReviewerUser(int seed, String email, String fullName, UserStatus status,
      LocalDate dob, String orcid, EducationLevel educationLevel, String orgName, String orgEmail,
      List<String> credentialUrls, List<Domain> domains, List<Specialization> specializations) {

    User user = User.builder()
        .id(SeedUtil.generateUUID("user-reviewer-" + seed))
        .email(email)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(fullName)
        .role(UserRole.REVIEWER)
        .status(status)
        .build();

    user = userRepository.save(user);

    ReviewerProfile profile = ReviewerProfile.builder()
        .id(SeedUtil.generateUUID("reviewer-profile-" + seed)) // Offset for profile IDs
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
          .id(SeedUtil.generateUUID("reviewer-domain-link" + seed))
          .reviewer(profile)
          .domain(domain)
          .build();
      reviewerDomainLinkRepository.save(link);
    }

    for (Specialization spec : specializations) {
      ReviewerSpecLink link = ReviewerSpecLink.builder()
          .id(SeedUtil.generateUUID("reviewer-spec-link-" + seed))
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
        .id(SeedUtil.generateUUID("user-org" + seed))
        .email(adminEmail)
        .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
        .fullName(adminFullName)
        .role(UserRole.ORGANIZATION_ADMIN)
        .status(status)
        .build();

    admin = userRepository.save(admin);

    OrganizationProfile organizationProfile = OrganizationProfile.builder()
        .id(SeedUtil.generateUUID("org-profile" + seed))
        .admin(admin)
        .name(orgName)
        .type(orgType)
        .email(orgEmail)
        .hotline(hotline)
        .address(address)
        .registrationNumber(registrationNumber)
        .logoKey(logoUrl)
        .build();

    organizationProfileRepository.save(organizationProfile);
  }
}
