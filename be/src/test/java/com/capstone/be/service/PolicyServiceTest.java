package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Policy;
import com.capstone.be.domain.entity.PolicyAcceptance;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.PolicyStatus;
import com.capstone.be.domain.enums.PolicyType;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import com.capstone.be.dto.response.policy.PolicyViewResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.PolicyAcceptanceRepository;
import com.capstone.be.repository.PolicyRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.PolicyServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("PolicyService Unit Tests")
class PolicyServiceTest {

  @Mock
  private PolicyRepository policyRepository;

  @Mock
  private PolicyAcceptanceRepository policyAcceptanceRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private PolicyServiceImpl policyService;

  private Policy policy;
  private User user;
  private UUID policyId;
  private UUID userId;

  @BeforeEach
  void setUp() {
    policyId = UUID.randomUUID();
    userId = UUID.randomUUID();

    policy = Policy.builder()
        .id(policyId)
        .type(PolicyType.TERMS_OF_SERVICE)
        .title("Terms of Service")
        .content("Policy content")
        .status(PolicyStatus.ACTIVE)
        .isRequired(true)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    user = User.builder()
        .id(userId)
        .email("user@example.com")
        .fullName("Test User")
        .build();
  }

  // test getAllPolicies should return all policies
  @Test
  @DisplayName("getAllPolicies should return all policies")
  void getAllPolicies_ShouldReturnAllPolicies() {
    List<Policy> policies = Arrays.asList(policy);
    when(policyRepository.findAll()).thenReturn(policies);

    List<PolicyResponse> result = policyService.getAllPolicies();

    assertNotNull(result);
    assertEquals(1, result.size());
    verify(policyRepository, times(1)).findAll();
  }

  // test getActivePolicyByType should return active policy
  @Test
  @DisplayName("getActivePolicyByType should return active policy")
  void getActivePolicyByType_ShouldReturnActivePolicy() {
    when(policyRepository.findByTypeAndStatus(PolicyType.TERMS_OF_SERVICE, PolicyStatus.ACTIVE))
        .thenReturn(Optional.of(policy));

    PolicyResponse result = policyService.getActivePolicyByType(PolicyType.TERMS_OF_SERVICE);

    assertNotNull(result);
    assertEquals(PolicyType.TERMS_OF_SERVICE, result.getType());
    verify(policyRepository, times(1))
        .findByTypeAndStatus(PolicyType.TERMS_OF_SERVICE, PolicyStatus.ACTIVE);
  }

  // test getActivePolicyByType should throw exception when not found
  @Test
  @DisplayName("getActivePolicyByType should throw exception when not found")
  void getActivePolicyByType_ShouldThrowException_WhenNotFound() {
    when(policyRepository.findByTypeAndStatus(PolicyType.TERMS_OF_SERVICE, PolicyStatus.ACTIVE))
        .thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> policyService.getActivePolicyByType(PolicyType.TERMS_OF_SERVICE));
  }

  // test getPolicyById should return policy
  @Test
  @DisplayName("getPolicyById should return policy")
  void getPolicyById_ShouldReturnPolicy() {
    when(policyRepository.findById(policyId)).thenReturn(Optional.of(policy));

    PolicyResponse result = policyService.getPolicyById(policyId);

    assertNotNull(result);
    assertEquals(policyId, result.getId());
    verify(policyRepository, times(1)).findById(policyId);
  }

  // test getPolicyView should return policy view with acceptance status
  @Test
  @DisplayName("getPolicyView should return policy view with acceptance status")
  void getPolicyView_ShouldReturnPolicyView() {
    PolicyAcceptance acceptance = PolicyAcceptance.builder()
        .id(UUID.randomUUID())
        .policy(policy)
        .user(user)
        .acceptedAt(Instant.now())
        .build();

    when(policyRepository.findById(policyId)).thenReturn(Optional.of(policy));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(policyAcceptanceRepository.findByPolicyAndUser(policy, user))
        .thenReturn(Optional.of(acceptance));

    PolicyViewResponse result = policyService.getPolicyView(policyId, userId);

    assertNotNull(result);
    assertEquals(true, result.getHasAccepted());
    assertNotNull(result.getAcceptanceDate());
  }

  // test getPolicyView should return false when not accepted
  @Test
  @DisplayName("getPolicyView should return false when not accepted")
  void getPolicyView_ShouldReturnFalse_WhenNotAccepted() {
    when(policyRepository.findById(policyId)).thenReturn(Optional.of(policy));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(policyAcceptanceRepository.findByPolicyAndUser(policy, user))
        .thenReturn(Optional.empty());

    PolicyViewResponse result = policyService.getPolicyView(policyId, userId);

    assertEquals(false, result.getHasAccepted());
  }

  // test updatePolicyByType should update policy
  @Test
  @DisplayName("updatePolicyByType should update policy")
  void updatePolicyByType_ShouldUpdatePolicy() {
    UpdatePolicyRequest request = UpdatePolicyRequest.builder()
        .title("Updated Title")
        .content("Updated content")
        .build();

    Policy updatedPolicy = Policy.builder()
        .id(policyId)
        .type(PolicyType.TERMS_OF_SERVICE)
        .title("Updated Title")
        .content("Updated content")
        .status(PolicyStatus.ACTIVE)
        .build();

    when(policyRepository.findByType(PolicyType.TERMS_OF_SERVICE))
        .thenReturn(Optional.of(policy));
    when(policyRepository.save(any(Policy.class))).thenReturn(updatedPolicy);

    PolicyResponse result = policyService.updatePolicyByType(PolicyType.TERMS_OF_SERVICE, request);

    assertNotNull(result);
    verify(policyRepository, times(1)).save(any(Policy.class));
  }

  // test acceptPolicy should create acceptance
  @Test
  @DisplayName("acceptPolicy should create acceptance")
  void acceptPolicy_ShouldCreateAcceptance() {
    PolicyAcceptance acceptance = PolicyAcceptance.builder()
        .id(UUID.randomUUID())
        .policy(policy)
        .user(user)
        .acceptedAt(Instant.now())
        .build();

    when(policyRepository.findById(policyId)).thenReturn(Optional.of(policy));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(policyAcceptanceRepository.existsByPolicyAndUser(policy, user)).thenReturn(false);
    when(policyAcceptanceRepository.save(any(PolicyAcceptance.class))).thenReturn(acceptance);

    policyService.acceptPolicy(policyId, userId);

    verify(policyAcceptanceRepository, times(1)).save(any(PolicyAcceptance.class));
  }

  // test acceptPolicy should not create duplicate acceptance
  @Test
  @DisplayName("acceptPolicy should not create duplicate acceptance")
  void acceptPolicy_ShouldNotCreateDuplicate() {
    when(policyRepository.findById(policyId)).thenReturn(Optional.of(policy));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(policyAcceptanceRepository.existsByPolicyAndUser(policy, user)).thenReturn(true);

    policyService.acceptPolicy(policyId, userId);

    verify(policyAcceptanceRepository, never()).save(any());
  }

  // test acceptPolicy should throw exception when policy not found
  @Test
  @DisplayName("acceptPolicy should throw exception when policy not found")
  void acceptPolicy_ShouldThrowException_WhenPolicyNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(policyRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> policyService.acceptPolicy(nonExistentId, userId));
    verify(policyAcceptanceRepository, never()).save(any());
  }
}


