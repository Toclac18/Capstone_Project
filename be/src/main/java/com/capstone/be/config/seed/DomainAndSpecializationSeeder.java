package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.SpecializationRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class DomainAndSpecializationSeeder {

  private final DomainRepository domainRepository;
  private final SpecializationRepository specializationRepository;


  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    if (domainRepository.count() > 0 || specializationRepository.count() > 0) {
      log.warn("Domain/Specialization already exists → skip seeding.");
      return;
    }

    // ===== Domain & Spec data =====
    List<DomainData> data = List.of(
        new DomainData("NATURAL AND PHYSICAL SCIENCES", List.of(
            "Mathematical Sciences",
            "Physics and Astronomy",
            "Chemical Sciences",
            "Earth Sciences",
            "Biological Sciences",
            "Other Natural and Physical Sciences"
        )),
        new DomainData("INFORMATION TECHNOLOGY", List.of(
            "Computer Science",
            "Information Systems",
            "Other Information Technology"
        )),
        new DomainData("ENGINEERING AND RELATED TECHNOLOGIES", List.of(
            "Manufacturing Engineering and Technology",
            "Process and Resources Engineering",
            "Automotive Engineering and Technology",
            "Mechanical and Industrial Engineering and Technology",
            "Civil Engineering",
            "Geomatic Engineering",
            "Electrical and Electronic Engineering and Technology",
            "Aerospace Engineering and Technology",
            "Maritime Engineering and Technology",
            "Other Engineering and Related Technologies"
        )),
        new DomainData("ARCHITECTURE AND BUILDING", List.of(
            "Architecture and Urban Environment",
            "Building"
        )),
        new DomainData("AGRICULTURE, ENVIRONMENTAL AND RELATED STUDIES", List.of(
            "Agriculture",
            "Horticulture and Viticulture",
            "Forestry Studies",
            "Fisheries Studies",
            "Environmental Studies",
            "Other Agriculture, Environmental and Related Studies"
        )),
        new DomainData("HEALTH", List.of(
            "Medical Studies",
            "Nursing",
            "Pharmacy",
            "Dental Studies",
            "Optical Science",
            "Veterinary Studies",
            "Public Health",
            "Radiography",
            "Rehabilitation Therapies",
            "Complementary Therapies",
            "Other Health"
        )),
        new DomainData("EDUCATION", List.of(
            "Teacher Education",
            "Curriculum and Education Studies",
            "Other Education"
        )),
        new DomainData("MANAGEMENT AND COMMERCE", List.of(
            "Accounting",
            "Business and Management",
            "Sales and Marketing",
            "Tourism",
            "Office Studies",
            "Banking, Finance and Related Fields",
            "Other Management and Commerce"
        )),
        new DomainData("SOCIETY AND CULTURE", List.of(
            "Political Science and Policy Studies",
            "Studies in Human Society",
            "Human Welfare Studies and Services",
            "Behavioural Science",
            "Law",
            "Justice and Law Enforcement",
            "Librarianship, Information Management and Curatorial Studies",
            "Language and Literature",
            "Philosophy and Religious Studies",
            "Economics and Econometrics",
            "Sport and Recreation",
            "Other Society and Culture"
        )),
        new DomainData("CREATIVE ARTS", List.of(
            "Performing Arts",
            "Visual Arts and Crafts",
            "Graphic and Design Studies",
            "Communication and Media Studies",
            "Other Creative Arts"
        )),
        new DomainData("FOOD, HOSPITALITY AND PERSONAL SERVICES", List.of(
            "Food and Hospitality",
            "Personal Services"
        )),
        new DomainData("MIXED FIELD PROGRAMMES", List.of(
            "General Education Programmes",
            "Social Skills Programmes",
            "Employment Skills Programmes",
            "Other Mixed Field Programmes"
        ))
    );

    // ===== GHI DB =====
    int domainIndex = 1; //also domainCount
    int specIndex;
    int specCount = 0;

    for (DomainData dd : data) {
      UUID xid = SeedUtil.generateUUID(domainIndex);
      Domain domain = Domain.builder()
          .id(xid)
          .code(domainIndex)
          .name(dd.name)
          .build();

      domainRepository.save(domain);

      specIndex = domainIndex * 100 + 1;
      for (String specName : dd.specializations) {
        Specialization spec = Specialization.builder()
            .id(SeedUtil.generateUUID(specIndex))
            .code(specIndex)
            .name(specName)
            .domain(domain)
            .build();

        specializationRepository.save(spec);
        specIndex++;
        specCount++;
      }

      domainIndex++;
    }

    log.info("Seeded {} domains and {} specializations",
        data.size(), specCount);
  }

  record DomainData(String name, List<String> specializations) {

  }

}
