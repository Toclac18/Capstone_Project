package com.capstone.be.controller;

import com.capstone.be.dto.request.policy.CreatePolicyRequest;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import com.capstone.be.service.PolicyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for policy-related operations
 */
@Slf4j
@RestController
@RequestMapping("/policies")
@RequiredArgsConstructor
public class PolicyController {

  private final PolicyService policyService;

  /**
   * Get all policies (for admin, ordered by creation date, newest first)
   * GET /api/policies
   */
  @GetMapping
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<List<PolicyResponse>> getAllPolicies() {
    log.info("System admin requesting all policies");
    List<PolicyResponse> policies = policyService.getAllPolicies();
    return ResponseEntity.ok(policies);
  }

  /**
   * Get active policy (PUBLIC - for users during registration)
   * GET /api/policies/active
   */
  @GetMapping("/active")
  public ResponseEntity<PolicyResponse> getActivePolicy() {
    log.info("Requesting active policy");
    PolicyResponse policy = policyService.getActivePolicy();
    return ResponseEntity.ok(policy);
  }

  /**
   * Get policy by ID (for admin)
   * GET /api/policies/{id}
   */
  @GetMapping("/{id}")
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<PolicyResponse> getPolicyById(@PathVariable UUID id) {
    log.info("System admin requesting policy by id: {}", id);
    PolicyResponse policy = policyService.getPolicyById(id);
    return ResponseEntity.ok(policy);
  }

  /**
   * Create a new policy version (for admin)
   * POST /api/policies
   */
  @PostMapping
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<PolicyResponse> createPolicy(
      @Valid @RequestBody CreatePolicyRequest request) {
    log.info("System admin creating new policy version: {}", request.getVersion());
    PolicyResponse policy = policyService.createPolicy(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(policy);
  }

  /**
   * Update policy (title and content only, version is immutable)
   * PUT /api/policies/{id}
   */
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<PolicyResponse> updatePolicy(
      @PathVariable UUID id,
      @Valid @RequestBody UpdatePolicyRequest request) {
    log.info("System admin updating policy: {}", id);
    PolicyResponse policy = policyService.updatePolicy(id, request);
    return ResponseEntity.ok(policy);
  }

  /**
   * Activate a policy (deactivates all others)
   * PATCH /api/policies/{id}/activate
   */
  @PatchMapping("/{id}/activate")
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<PolicyResponse> activatePolicy(@PathVariable UUID id) {
    log.info("System admin activating policy: {}", id);
    PolicyResponse policy = policyService.activatePolicy(id);
    return ResponseEntity.ok(policy);
  }

  /**
   * Deactivate a policy
   * PATCH /api/policies/{id}/deactivate
   */
  @PatchMapping("/{id}/deactivate")
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<PolicyResponse> deactivatePolicy(@PathVariable UUID id) {
    log.info("System admin deactivating policy: {}", id);
    PolicyResponse policy = policyService.deactivatePolicy(id);
    return ResponseEntity.ok(policy);
  }

  /**
   * Delete a policy (cannot delete if active)
   * DELETE /api/policies/{id}
   */
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('SYSTEM_ADMIN')")
  public ResponseEntity<Void> deletePolicy(@PathVariable UUID id) {
    log.info("System admin deleting policy: {}", id);
    policyService.deletePolicy(id);
    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}

