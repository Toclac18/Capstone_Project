package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.Policy;
import com.capstone.be.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for Policy (dev profile only)
 * Seeds initial Term of User policy version
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class PolicySeeder {

  private final PolicyRepository policyRepository;

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    if (policyRepository.count() > 0) {
      log.warn("Policies already exist → skip seeding.");
      return;
    }

    log.info("Starting Policy seeding...");

    // Seed initial Term of User policy version 1.0 (active)
    createPolicy("1.0", "Term of User",
        """
            <h2>Term of User</h2>
            <p>Welcome to Readee System. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
            <h3>2. Use License</h3>
            <p>Permission is granted to temporarily access the materials on Readee System for personal, non-commercial transitory viewing only.</p>
            <h3>3. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your account and password.</p>
            <h3>4. Content</h3>
            <p>Users are responsible for the content they upload and must ensure it complies with our guidelines.</p>
            <h3>5. Prohibited Uses</h3>
            <p>You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.</p>
            <h3>6. Privacy</h3>
            <p>Your privacy is important to us. We collect and use your information as described in our privacy practices.</p>
            <h3>7. Intellectual Property</h3>
            <p>All content on Readee System is protected by copyright and other intellectual property laws.</p>
            <h3>8. Limitation of Liability</h3>
            <p>Readee System shall not be liable for any indirect, incidental, special, or consequential damages.</p>
            <h3>9. Changes to Terms</h3>
            <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of the modified terms.</p>
            <h3>10. Contact</h3>
            <p>If you have any questions about these Terms, please contact us.</p>
            """,
        true);

    log.info("Seeded initial Policy version 1.0 successfully.");
  }

  private void createPolicy(String version, String title, String content, boolean isActive) {
    Policy policy = Policy.builder()
        .id(SeedUtil.generateUUID("policy-" + version))
        .version(version)
        .title(title)
        .content(content)
        .isActive(isActive)
        .build();

    policyRepository.save(policy);
    log.debug("Created policy: version={}, title={}, isActive={}", version, title, isActive);
  }
}

