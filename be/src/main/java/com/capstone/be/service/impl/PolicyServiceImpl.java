package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Policy;
import com.capstone.be.domain.entity.PolicyAcceptance;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.PolicyStatus;
import com.capstone.be.domain.enums.PolicyType;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import com.capstone.be.dto.response.policy.PolicyViewResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.PolicyAcceptanceRepository;
import com.capstone.be.repository.PolicyRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.PolicyService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyServiceImpl implements PolicyService {

  private final PolicyRepository policyRepository;
  private final PolicyAcceptanceRepository policyAcceptanceRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public List<PolicyResponse> getAllPolicies() {
    List<Policy> policies = policyRepository.findAll();
    return policies.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public PolicyResponse getActivePolicyByType(PolicyType type) {
    Policy policy = policyRepository.findByTypeAndStatus(type, PolicyStatus.ACTIVE)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Active policy not found for type: " + type,
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
  @Transactional(readOnly = true)
  public PolicyViewResponse getPolicyView(UUID id, UUID userId) {
    Policy policy = policyRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + id,
            "POLICY_NOT_FOUND"
        ));

    boolean hasAccepted = false;
    Instant acceptanceDate = null;

    if (userId != null) {
      User user = userRepository.findById(userId)
          .orElse(null);

      if (user != null) {
        Optional<PolicyAcceptance> acceptanceOpt = policyAcceptanceRepository.findByPolicyAndUser(policy, user);
        if (acceptanceOpt.isPresent()) {
          PolicyAcceptance acceptance = acceptanceOpt.get();
          hasAccepted = true;
          acceptanceDate = acceptance.getAcceptedAt();
        }
      }
    }

    return PolicyViewResponse.builder()
        .policy(toResponse(policy))
        .hasAccepted(hasAccepted)
        .acceptanceDate(acceptanceDate)
        .build();
  }

  @Override
  @Transactional
  public PolicyResponse updatePolicyByType(PolicyType type, UpdatePolicyRequest request) {
    Policy policy = policyRepository.findByType(type)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found for type: " + type,
            "POLICY_NOT_FOUND"
        ));

    // Update fields if provided
    if (request.getTitle() != null) {
      policy.setTitle(request.getTitle());
    }
    if (request.getContent() != null) {
      policy.setContent(request.getContent());
    }
    if (request.getStatus() != null) {
      policy.setStatus(request.getStatus());
    }
    if (request.getIsRequired() != null) {
      policy.setIsRequired(request.getIsRequired());
    }

    Policy updated = policyRepository.save(policy);
    log.info("Policy updated: type={}, id={}", type, updated.getId());
    return toResponse(updated);
  }

  @Override
  @Transactional
  public void acceptPolicy(UUID policyId, UUID userId) {
    Policy policy = policyRepository.findById(policyId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Policy not found with id: " + policyId,
            "POLICY_NOT_FOUND"
        ));

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "User not found with id: " + userId,
            "USER_NOT_FOUND"
        ));

    // Check if already accepted
    if (policyAcceptanceRepository.existsByPolicyAndUser(policy, user)) {
      log.info("Policy already accepted: policyId={}, userId={}", policyId, userId);
      return; // Already accepted, no error
    }

    // Create acceptance record
    PolicyAcceptance acceptance = PolicyAcceptance.builder()
        .policy(policy)
        .user(user)
        .build();
    // acceptedAt will be set automatically by @PrePersist

    policyAcceptanceRepository.save(acceptance);
    log.info("Policy accepted: policyId={}, userId={}", policyId, userId);
  }

  private PolicyResponse toResponse(Policy policy) {
    return PolicyResponse.builder()
        .id(policy.getId())
        .type(policy.getType())
        .title(policy.getTitle())
        .content(policy.getContent())
        .status(policy.getStatus())
        .isRequired(policy.getIsRequired())
        .updatedAt(policy.getUpdatedAt())
        .build();
  }
}

