package com.capstone.be.service;

import com.capstone.be.dto.request.policy.CreatePolicyRequest;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service for policy-related operations
 */
public interface PolicyService {

  /**
   * Get all policies (ordered by creation date, newest first)
   *
   * @return List of all policies
   */
  List<PolicyResponse> getAllPolicies();

  /**
   * Get active policy (for users to view during registration)
   *
   * @return Active policy
   */
  PolicyResponse getActivePolicy();

  /**
   * Get policy by ID
   *
   * @param id Policy ID
   * @return Policy
   */
  PolicyResponse getPolicyById(UUID id);

  /**
   * Create a new policy version
   *
   * @param request Create request
   * @return Created policy
   */
  PolicyResponse createPolicy(CreatePolicyRequest request);

  /**
   * Update policy (title and content only, version is immutable)
   *
   * @param id      Policy ID
   * @param request Update request
   * @return Updated policy
   */
  PolicyResponse updatePolicy(UUID id, UpdatePolicyRequest request);

  /**
   * Activate a policy (deactivates all others)
   *
   * @param id Policy ID
   * @return Activated policy
   */
  PolicyResponse activatePolicy(UUID id);

  /**
   * Deactivate a policy
   *
   * @param id Policy ID
   * @return Deactivated policy
   */
  PolicyResponse deactivatePolicy(UUID id);

  /**
   * Delete a policy (cannot delete if active)
   *
   * @param id Policy ID
   */
  void deletePolicy(UUID id);
}

