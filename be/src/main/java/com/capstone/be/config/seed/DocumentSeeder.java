package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.TagSeededEvent;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for Document (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentSeeder {

  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final DocTypeRepository docTypeRepository;
  private final SpecializationRepository specializationRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final TagRepository tagRepository;
  private final DocumentTagLinkRepository documentTagLinkRepository;


  @Transactional
  @EventListener(TagSeededEvent.class)
  public void run() {
    log.info("\uD83C\uDF31 Start seeding Document");

    if (documentRepository.count() > 0) {
      log.warn("Document already exist → skip seeding.");
      return;
    }

    for (int i = 0; i < 1; i++) {
      createDocument(i);
    }

  }

  private void createDocument(int seed) {
    OrganizationProfile orgProfile =
        organizationProfileRepository.findByEmail("contact@hust.edu.vn").orElse(null);

    User user = userRepository.findByEmail("reader1@gmail.com").orElse(null);

    DocType docType = docTypeRepository.findAll().getFirst();
    Specialization spec = specializationRepository.findAll().getFirst();

    //if null, #later

    Document document = Document.builder()
        .id(SeedUtil.generateUUID("doc-" + seed))
        .title("Sách giáo khoa toán 11")
        .description("quyển sách này rất hay nhé")
        .uploader(user)
        .organization(orgProfile)
        .visibility(DocVisibility.PUBLIC)
        .docType(docType)
        .isPremium(true)
        .price(100)
        .thumbnailKey("thumbnail-1.png")
        .fileKey("file-1.pdf")
        .pageCount(20)
        .status(DocStatus.VERIFIED)
        .specialization(spec)
        .build();

    Document savedDoc = documentRepository.save(document);

    Tag tag1 = tagRepository.findByCode(1L).orElse(null);
    Tag tag2 = tagRepository.findByCode(2L).orElse(null);

    if (tag1 != null & tag2 != null) {
      var link1 = DocumentTagLink.builder().tag(tag1).document(savedDoc).build();
      var link2 = DocumentTagLink.builder().tag(tag2).document(savedDoc).build();

      documentTagLinkRepository.save(link1);
      documentTagLinkRepository.save(link2);
    }
  }
}
