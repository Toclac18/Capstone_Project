package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.ImportResultItem;
import com.capstone.be.domain.entity.MemberImportBatch;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.repository.ImportResultItemRepository;
import com.capstone.be.repository.MemberImportBatchRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for Org Enrollment (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class OrgEnrollmentSeeder {

  private final OrgEnrollmentRepository enrollmentRepository;
  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final MemberImportBatchRepository batchRepository;
  private final ImportResultItemRepository importResultItemRepository;

  private static final Instant DEFAULT_EXPIRY = Instant.parse("2025-12-31T23:59:59.00Z");

  @Transactional
  @EventListener(UserSeededEvent.class)
  public void run() {
    log.info("🌱 start seeding Org Enrollment");
    List<String> readerEmails = List.of(
        "reader1@gmail.com",
        "reader2@gmail.com"
    );
    String orgAdminEmail = "org1@gmail.com";

    createOrgEnrollment(readerEmails, orgAdminEmail);
  }

  private void createOrgEnrollment(List<String> readerEmails, String orgAdminEmail) {
    Optional<User> orgAdminOpt = userRepository.findByEmail(orgAdminEmail);
    if (orgAdminOpt.isEmpty()) {
      log.warn("Skipping OrgEnrollmentSeeder: org admin {} not found", orgAdminEmail);
      return;
    }

    User orgAdmin = orgAdminOpt.get();
    Optional<OrganizationProfile> orgProfileOpt = organizationProfileRepository.findByUserId(orgAdmin.getId());
    if (orgProfileOpt.isEmpty()) {
      log.warn("Skipping OrgEnrollmentSeeder: organization profile for {} is missing",
          orgAdminEmail);
      return;
    }

    List<User> readers = userRepository.findByEmailIn(readerEmails);

    OrganizationProfile orgProfile = orgProfileOpt.get();
    MemberImportBatch batch = createBatch(orgProfile, orgAdmin, readers.size());
    
    readers.forEach(reader -> {
      OrgEnrollment enrollment = buildEnrollment(reader, orgProfile, batch);
      enrollmentRepository.save(enrollment);
    });

    log.info("✅ Created {} org enrollments", readers.size());

  }

  private MemberImportBatch createBatch(OrganizationProfile orgProfile, User orgAdmin, int count) {
    MemberImportBatch batch = MemberImportBatch.builder()
        .organization(orgProfile).admin(orgAdmin)
        .importSource("EXCEL").totalEmails(count)
        .successCount(count).failedCount(1)
        .skippedCount(1).fileName("sample_readers.xlsx")
        .fileKey(null).notes(null)
        .build();

    return batchRepository.save(batch);
  }

  private OrgEnrollment buildEnrollment(User member, OrganizationProfile orgProfile,
      MemberImportBatch batch) {
    String enrollmentId = String.format("org-enrollment-%s", member.getEmail());
    return OrgEnrollment.builder()
        .id(SeedUtil.generateUUID(enrollmentId))
        .status(OrgEnrollStatus.JOINED)
        .member(member)
        .organization(orgProfile)
        .memberEmail(member.getEmail())
        .importBatch(batch)
        .expiry(DEFAULT_EXPIRY) //dump
        .build();
  }
}