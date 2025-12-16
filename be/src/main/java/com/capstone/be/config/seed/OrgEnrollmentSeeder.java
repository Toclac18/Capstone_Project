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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
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
  public void run() throws NotFoundException {
    log.info("\uD83C\uDF31 start seeding Org Enrollment");
    User reader1 = userRepository.findByEmail("reader1@gmail.com")
        .orElseThrow(NotFoundException::new);
    User reader2 = userRepository.findByEmail("reader2@gmail.com")
        .orElseThrow(NotFoundException::new);
    User orgAdmin = userRepository.findByEmail("org1.admin@hust.edu.vn")
        .orElseThrow(NotFoundException::new);
    OrganizationProfile orgProfile = organizationProfileRepository
        .findByUserId(orgAdmin.getId()).orElseThrow(NotFoundException::new);

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
