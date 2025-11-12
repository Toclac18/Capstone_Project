package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.enums.OrganizationStatus;
import com.capstone.be.domain.enums.OrganizationType;
import com.capstone.be.repository.OrganizationRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Profile("dev")
@Component
@RequiredArgsConstructor
public class OrganizationSeeder implements CommandLineRunner {

  private final OrganizationRepository organizationRepository;

  @Override
  public void run(String... args) throws Exception {
    if (organizationRepository.count() == 0) {
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
        newOrg.setStatus(switch (i % 4) {
          case 0 -> OrganizationStatus.PENDING_VERIFICATION;
          case 1 -> OrganizationStatus.ACTIVE;
          case 2 -> OrganizationStatus.DEACTIVE;
          case 3 -> OrganizationStatus.DELETED;
          default -> throw new IllegalStateException("Org seed: Unexpected value: " + i % 3);
        });
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
