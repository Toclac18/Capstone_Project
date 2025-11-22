package com.capstone.be.service;

import com.capstone.be.domain.enums.PolicyType;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import com.capstone.be.dto.response.policy.PolicyViewResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service for policy-related operations
 */
public interface PolicyService {

  /**
   * Get all policies
   *
   * @return List of all policies
   */
  List<PolicyResponse> getAllPolicies();

  /**
   * Get active policy by type (for users to view)
   *
   * @param type Policy type
   * @return Active policy
   */
  PolicyResponse getActivePolicyByType(PolicyType type);

  /**
   * Get policy by ID
   *
   * @param id Policy ID
   * @return Policy
   */
  PolicyResponse getPolicyById(UUID id);

  /**
   * Get policy view with acceptance status (for users)
   *
   * @param id     Policy ID
   * @param userId User ID (optional)
   * @return Policy view with acceptance status
   */
  PolicyViewResponse getPolicyView(UUID id, UUID userId);

  /**
   * Update policy by type
   *
   * @param type    Policy type
   * @param request Update request
   * @return Updated policy
   */
  PolicyResponse updatePolicyByType(PolicyType type, UpdatePolicyRequest request);

  /**
   * Accept policy (for users)
   *
   * @param policyId Policy ID
   * @param userId   User ID
   */
  void acceptPolicy(UUID policyId, UUID userId);
}

