//package com.capstone.be.config.seed;
//
//
//import com.capstone.be.domain.entity_old.Organization;
//import com.capstone.be.domain.entity_old.OrganizationEnrollment;
//import com.capstone.be.domain.entity_old.Reader;
//import com.capstone.be.domain.enums_old.EnrollmentStatus;
//import com.capstone.be.domain.enums_old.OrganizationStatus;
//import com.capstone.be.domain.enums_old.OrganizationType;
//import com.capstone.be.domain.enums_old.ReaderStatus;
//import com.capstone.be.repository.EnrollmentRepository;
//import com.capstone.be.repository.OrganizationRepository;
//import com.capstone.be.repository.ReaderRepository;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.stream.IntStream;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.context.annotation.Profile;
//import org.springframework.context.event.EventListener;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Component;
//import org.springframework.transaction.annotation.Transactional;
//
//@Profile("dev")
//@Component
//@RequiredArgsConstructor
//@Slf4j
//public class ReaderSeeder {
//
//  private final ReaderRepository readerRepository;
//  private final OrganizationRepository organizationRepository;
//  private final EnrollmentRepository enrollmentRepository;
//  private final PasswordEncoder passwordEncoder;
//
//  @Transactional
//  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
//
//  public void run() throws Exception {
//    log.info("Start ReaderSeeder");
//    if (readerRepository.existsByUsername("nguyentathung01")) {
//      return;
//    }
//    //Reader
//    Reader newReader = new Reader();
//    newReader.setFullName("Nguyễn Tất Hưng");
//    newReader.setUsername("nguyentathung01");
//    newReader.setDateOfBirth(LocalDate.of(2004, 1, 1));
//    newReader.setEmail("nguyentathung01@gmail.com");
//    newReader.setStatus(ReaderStatus.ACTIVE);
//    newReader.setPasswordHash(passwordEncoder.encode("aa123123"));
//    newReader.setPoint(0);
//
//    Reader savedReader = readerRepository.save(newReader);
//
//    //Orgs
//    List<Organization> orgs = IntStream.range(0, 10).mapToObj(i -> {
//      Organization newOrg = new Organization();
//      //newOrg.setId();
//      newOrg.setName("joinedORG " + String.format("%03d", i));
//      newOrg.setEmail("joinedORG" + String.format("%03d", i) + "@example.com");
//      newOrg.setHotline("09" + String.format("%08d", i));
//      newOrg.setAddress("Street " + i);
//      newOrg.setRegistrationNumber("REG-" + String.format("%05d", i));
//      newOrg.setType(
//          switch (i % 3) {
//            case 0 -> OrganizationType.TYPE1;
//            case 1 -> OrganizationType.TYPE2;
//            case 2 -> OrganizationType.TYPE3;
//            default -> throw new IllegalStateException("Org seed: Unexpected value: " + i % 3);
//          }
//      );
//      newOrg.setStatus(
//          OrganizationStatus.ACTIVE
//      );
//      newOrg.setActive(true);
//      newOrg.setDeleted(false);
//      newOrg.setCreatedAt(LocalDateTime.of(2025, 11, 1, 12, 0));
//
//      return newOrg;
//    }).toList();
//
//    List<Organization> savedOrgs = organizationRepository.saveAll(orgs);
//
//    //Enrollment
//    for (Organization o : savedOrgs) {
//      OrganizationEnrollment enrollment = new OrganizationEnrollment();
//      enrollment.setReader(savedReader);
//      enrollment.setOrganization(o);
//      enrollment.setAddedAt(LocalDateTime.of(2025, 11, 2, 12, 0));
//      enrollment.setStatus(EnrollmentStatus.ACTIVE);
//
//      enrollmentRepository.save(enrollment);
//    }
//
//    System.out.println("✅ [SeedData] Inserted 1 Reader & 10 Orgs & 10 Enrollment");
//
//  }
//}
