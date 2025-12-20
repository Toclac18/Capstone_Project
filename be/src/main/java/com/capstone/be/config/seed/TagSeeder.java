package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.TagSeededEvent;
import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.repository.TagRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for Tag (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class TagSeeder {

  private final TagRepository tagRepository;

  private final ApplicationEventPublisher eventPublisher;


  @Transactional
  @EventListener(UserSeededEvent.class)
  public void run() {

    log.info("\uD83C\uDF31 Start seeding Tag");

    if (tagRepository.count() > 0) {
      log.warn("Tags already exist → skip seeding.");
      eventPublisher.publishEvent(new TagSeededEvent());
      return;
    }

    List<String> tagNames = List.of(
        // Technology & Programming
        "algorithms",
        "data-structures",
        "clean-code",
        "design-patterns",
        "system-design",
        "software-architecture",
        "debugging",
        "refactoring",
        "performance",
        "concurrency",
        "memory-management",
        "api-design",
        "microservices",
        "cicd",
        "devops",
        "docker",
        "kubernetes",
        "cloud-computing",
        "cybersecurity",
        "unit-testing",
        "integration-testing"
    );


    int n = tagNames.size();
    for (int i = 0 ; i< n; i++){
      TagStatus status = TagStatus.ACTIVE;
      if (i == n - 2) {
        status = TagStatus.PENDING;
      } else if (i == n - 1) {
        status = TagStatus.REJECTED;
      }
      createTag(i, tagNames.get(i), status);
    }

//    int tagCount = 15;
//    for (int i = 0; i < tagCount; i++) {
//      TagStatus status = TagStatus.ACTIVE;
//      if (i == tagCount - 2) {
//        status = TagStatus.PENDING;
//      } else if (i == tagCount - 1) {
//        status = TagStatus.REJECTED;
//      }
//      createTag(i, "tag" + i, status);
//    }

    eventPublisher.publishEvent(new TagSeededEvent());

  }

  private void createTag(int code, String name, TagStatus status) {
    Tag tag = Tag.builder()
        .id(SeedUtil.generateUUID("tag-" + code))
//        .code(code) //auto-gen
        .name(name)
        .status(status)
        .build();

    tagRepository.save(tag);
  }
}
