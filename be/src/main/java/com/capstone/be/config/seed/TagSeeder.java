package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.TagSeededEvent;
import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.repository.TagRepository;
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

    for (int i = 0; i < 10; i++) {
      TagStatus status = i < 7 ? TagStatus.ACTIVE : i < 9 ? TagStatus.PENDING : TagStatus.REJECTED;
      createTag(i, "tag" + i, status);
    }

    eventPublisher.publishEvent(new TagSeededEvent());

  }

  private void createTag(int code, String name, TagStatus status) {
    Tag tag = Tag.builder()
        .id(SeedUtil.generateUUID("tag-" + code))
//        .code(code)
        .name(name)
        .status(status)
        .build();

    tagRepository.save(tag);
  }
}
