package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.OrganizationStatus;
import com.capstone.be.domain.enums.OrganizationType;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Profile("dev")
@Component
@RequiredArgsConstructor
public class OrganizationSeeder {

  private final OrganizationRepository organizationRepository;
  private final ReaderRepository readerRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() throws Exception {
    if (!organizationRepository.existsByEmail("fptu@gmail.com")) {
      Organization fptu = new Organization();
      //newOrg.setId();
      fptu.setName("FPTU");
      fptu.setEmail("fptu@gmail.com");
      fptu.setHotline("09123123123");
      fptu.setAddress("Thach Hoa, TT, HN ");
      fptu.setRegistrationNumber("REG-FPT-123");
      fptu.setAdminName("adminFPT");
      fptu.setAdminEmail("fptadmin@gmail.com");
      fptu.setAdminPassword(passwordEncoder.encode("aa123123"));
      fptu.setType(OrganizationType.TYPE1);
      fptu.setStatus(OrganizationStatus.ACTIVE);
      fptu.setActive(true);
      fptu.setDeleted(false);
      fptu.setCreatedAt(LocalDateTime.of(2025, 11, 1, 12, 0));

      organizationRepository.save(fptu);

      //Members
      List<Reader> members = IntStream.range(0, 20).mapToObj(i -> {
        Reader r = new Reader();
        r.setFullName("Member 0" + i);
        r.setUsername("member_0" + i);
        r.setDateOfBirth(LocalDate.of(2004, 1, 1));
        r.setEmail("member0" + i + "@gmail.com");
        r.setStatus(ReaderStatus.ACTIVE);
        r.setPasswordHash(passwordEncoder.encode("aa123123"));
        r.setPoint(0);

        return r;
      }).toList();

      readerRepository.saveAll(members);

      List<Organization> orgs = IntStream.range(0, 10).mapToObj(i -> {
        Organization newOrg = new Organization();
        //newOrg.setId();
        newOrg.setName("ORG " + String.format("%03d", i));
        newOrg.setEmail("org" + String.format("%03d", i) + "@example.com");
        newOrg.setHotline("09" + String.format("%08d", i));
        newOrg.setAddress("Street " + i);
        newOrg.setRegistrationNumber("REG-" + String.format("%05d", i));
        newOrg.setType(
            switch (i % 3) {
              case 0 -> OrganizationType.TYPE1;
              case 1 -> OrganizationType.TYPE2;
              case 2 -> OrganizationType.TYPE3;
              default -> throw new IllegalStateException("Org seed: Unexpected value: " + i % 3);
            }
        );
        newOrg.setStatus(OrganizationStatus.ACTIVE);
        newOrg.setActive(true);
        newOrg.setDeleted(false);
        newOrg.setCreatedAt(LocalDateTime.of(2025, 11, 1, 12, 0));

        return newOrg;
      }).toList();

      organizationRepository.saveAll(orgs);

      System.out.println("✅ [SeedData] Inserted " + orgs.size() + " organization successfully.");

    }

  }
}
