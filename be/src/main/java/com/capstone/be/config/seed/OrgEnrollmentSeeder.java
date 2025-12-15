package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.MemberImportBatch;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.repository.MemberImportBatchRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import java.time.Instant;
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

  @Transactional
  @EventListener(UserSeededEvent.class)
  public void run() {
    log.info("\uD83C\uDF31 start seeding Org Enrollment");

    Optional<User> reader1Opt = userRepository.findByEmail("reader1@gmail.com");
    Optional<User> reader2Opt = userRepository.findByEmail("reader2@gmail.com");
    Optional<User> orgAdminOpt = userRepository.findByEmail("org1.admin@hust.edu.vn");

    if (reader1Opt.isEmpty() || reader2Opt.isEmpty() || orgAdminOpt.isEmpty()) {
      log.warn("Skipping OrgEnrollmentSeeder because required seed users are missing. " +
          "reader1: {}, reader2: {}, orgAdmin: {}",
          reader1Opt.isPresent(), reader2Opt.isPresent(), orgAdminOpt.isPresent());
      return;
    }

    User reader1 = reader1Opt.get();
    User reader2 = reader2Opt.get();
    User orgAdmin = orgAdminOpt.get();

    Optional<OrganizationProfile> orgProfileOpt = organizationProfileRepository.findByUserId(orgAdmin.getId());
    if (orgProfileOpt.isEmpty()) {
      log.warn("Skipping OrgEnrollmentSeeder because organization profile for {} is missing", orgAdmin.getEmail());
      return;
    }
    OrganizationProfile orgProfile = orgProfileOpt.get();

    MemberImportBatch batch = new MemberImportBatch(
        orgProfile,
        orgAdmin,
        "MANUAL",
        2, 2, 0, 0,
        null, null);

    MemberImportBatch savedBatch = batchRepository.save(batch);

    OrgEnrollment enrollment1 = OrgEnrollment.builder()
        .id(SeedUtil.generateUUID("org-enrollment-1"))
        .status(OrgEnrollStatus.JOINED)
        .member(reader1)
        .organization(orgProfile)
        .memberEmail(reader1.getEmail())
        .importBatch(savedBatch)
        .expiry(Instant.parse("2025-12-31T23:59:59.00Z"))
        .build();

    OrgEnrollment enrollment2 = OrgEnrollment.builder()
        .id(SeedUtil.generateUUID("org-enrollment-2"))
        .status(OrgEnrollStatus.JOINED)
        .member(reader2)
        .organization(orgProfile)
        .memberEmail(reader2.getEmail())
        .importBatch(savedBatch)
        .expiry(Instant.parse("2025-12-31T23:59:59.00Z"))
        .build();

    enrollmentRepository.save(enrollment1);
    enrollmentRepository.save(enrollment2);

  }
}
