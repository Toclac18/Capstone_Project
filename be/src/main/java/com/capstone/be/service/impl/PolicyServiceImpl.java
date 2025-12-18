package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Policy;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.policy.CreatePolicyRequest;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.PolicyRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.UserSpecification;
import com.capstone.be.service.PolicyService;
import com.capstone.be.service.helper.NotificationHelper;
import com.capstone.be.util.HtmlSanitizerUtil;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyServiceImpl implements PolicyService {

  private final PolicyRepository policyRepository;
  private final UserRepository userRepository;
  private final NotificationHelper notificationHelper;

  @Override
  @Transactional(readOnly = true)
  public List<PolicyResponse> getAllPolicies() {
    List<Policy> policies = policyRepository.findAllByOrderByCreatedAtDesc();
    return policies.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public PolicyResponse getActivePolicy() {
    Policy policy = policyRepository.findByIsActive(true)
        .orElseThrow(() -> new ResourceNotFoundException(
            "No active policy found",
            "POLICY_NOT_FOUND"
        ));
    return toResponse(policy);
  }

  @Override
  @Transactional(readOnly = true)
  public PolicyResponse getPolicyById(UUID id) {
    Policy policy = policyRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + id,
            "POLICY_NOT_FOUND"
        ));
    return toResponse(policy);
  }

  @Override
  @Transactional
  public PolicyResponse createPolicy(CreatePolicyRequest request) {
    // Validate version uniqueness
    if (policyRepository.existsByVersion(request.getVersion())) {
      throw new BusinessException(
          "Policy version already exists: " + request.getVersion(),
          HttpStatus.BAD_REQUEST,
          "DUPLICATE_VERSION"
      );
    }

    // Sanitize HTML content to prevent XSS attacks
    String sanitizedContent = HtmlSanitizerUtil.sanitizePolicyContent(request.getContent());
    
    // Create new policy with isActive = false by default
    Policy policy = Policy.builder()
        .version(request.getVersion().trim())
        .title(request.getTitle().trim())
        .content(sanitizedContent)
        .isActive(false) // New policies are inactive by default
        .build();

    Policy saved = policyRepository.save(policy);
    log.info("Created new policy version: id={}, version={}", saved.getId(), saved.getVersion());
    return toResponse(saved);
  }

  @Override
  @Transactional
  public PolicyResponse updatePolicy(UUID id, UpdatePolicyRequest request) {
    Policy policy = policyRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + id,
            "POLICY_NOT_FOUND"
        ));

    // Warn if updating active policy
    if (Boolean.TRUE.equals(policy.getIsActive())) {
      log.warn("Updating active policy: id={}, version={}. " +
               "This will affect users who see this policy during registration.",
               id, policy.getVersion());
    }

    // Validate that at least one field is provided
    boolean hasTitle = request.getTitle() != null && !request.getTitle().trim().isEmpty();
    boolean hasContent = request.getContent() != null && !request.getContent().trim().isEmpty() 
        && !request.getContent().trim().equals("<p><br></p>");
    
    if (!hasTitle && !hasContent) {
      throw new BusinessException(
          "At least one of title or content must be provided",
          HttpStatus.BAD_REQUEST,
          "INVALID_UPDATE_REQUEST"
      );
    }

    // Update fields if provided
    if (hasTitle) {
      policy.setTitle(request.getTitle().trim());
    }
    if (hasContent) {
      // Sanitize HTML content to prevent XSS attacks
      String sanitizedContent = HtmlSanitizerUtil.sanitizePolicyContent(request.getContent());
      policy.setContent(sanitizedContent);
    }

    // Version and isActive cannot be updated here
    // Version is immutable
    // isActive must be changed via activate/deactivate endpoints

    Policy updated = policyRepository.save(policy);
    log.info("Policy updated: id={}, version={}, isActive={}",
             updated.getId(), updated.getVersion(), updated.getIsActive());
    return toResponse(updated);
  }

  @Override
  @Transactional
  public PolicyResponse activatePolicy(UUID id) {
    Policy policy = policyRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + id,
            "POLICY_NOT_FOUND"
        ));

    // Deactivate all other policies
    List<Policy> activePolicies = policyRepository.findAllByIsActive(true);
    if (!activePolicies.isEmpty()) {
      for (Policy p : activePolicies) {
        p.setIsActive(false);
      }
      policyRepository.saveAll(activePolicies);
      log.info("Deactivated {} existing active policies", activePolicies.size());
    }

    // Activate this policy
    policy.setIsActive(true);
    Policy activated = policyRepository.save(policy);
    log.info("Activated policy: id={}, version={}", activated.getId(), activated.getVersion());

    // Notify all ACTIVE users about Terms of Service update
    Specification<User> spec = UserSpecification.hasStatus(UserStatus.ACTIVE);
    List<User> activeUsers = userRepository.findAll(spec);
    log.info("Sending ToS update notification to {} active users", activeUsers.size());

    for (User user : activeUsers) {
      try {
        notificationHelper.sendSystemNotification(
            user,
            "Terms of Service Updated",
            String.format("Our Terms of Service has been updated to version %s. Please review the changes.",
                activated.getVersion())
        );
      } catch (Exception e) {
        log.error("Failed to send ToS notification to user {}: {}", user.getId(), e.getMessage());
      }
    }

    return toResponse(activated);
  }

  @Override
  @Transactional
  public PolicyResponse deactivatePolicy(UUID id) {
    Policy policy = policyRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + id,
            "POLICY_NOT_FOUND"
        ));

    if (!Boolean.TRUE.equals(policy.getIsActive())) {
      log.warn("Policy is already inactive: id={}, version={}", id, policy.getVersion());
      return toResponse(policy);
    }

    policy.setIsActive(false);
    Policy deactivated = policyRepository.save(policy);
    log.info("Deactivated policy: id={}, version={}", deactivated.getId(), deactivated.getVersion());
    return toResponse(deactivated);
  }

  @Override
  @Transactional
  public void deletePolicy(UUID id) {
    Policy policy = policyRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + id,
            "POLICY_NOT_FOUND"
        ));

    // Cannot delete active policy
    if (Boolean.TRUE.equals(policy.getIsActive())) {
      throw new BusinessException(
          "Cannot delete active policy. Please deactivate it first.",
          HttpStatus.BAD_REQUEST,
          "CANNOT_DELETE_ACTIVE_POLICY"
      );
    }

    policyRepository.delete(policy);
    log.info("Deleted policy: id={}, version={}", id, policy.getVersion());
  }

  private PolicyResponse toResponse(Policy policy) {
    return PolicyResponse.builder()
        .id(policy.getId())
        .version(policy.getVersion())
        .title(policy.getTitle())
        .content(policy.getContent())
        .isActive(policy.getIsActive())
        .createdAt(policy.getCreatedAt())
        .updatedAt(policy.getUpdatedAt())
        .build();
  }
}

