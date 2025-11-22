package com.capstone.be.controller;

import com.capstone.be.domain.enums.PolicyType;
import com.capstone.be.dto.request.policy.UpdatePolicyRequest;
import com.capstone.be.dto.response.policy.PolicyResponse;
import com.capstone.be.dto.response.policy.PolicyViewResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.PolicyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for policy-related operations
 */
@Slf4j
@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

  private final PolicyService policyService;

  /**
   * Get all policies (for admin)
   * GET /api/policies
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('SYSTEM_ADMIN')")
  public ResponseEntity<List<PolicyResponse>> getAllPolicies() {
    log.info("Get all policies request");
    List<PolicyResponse> policies = policyService.getAllPolicies();
    return ResponseEntity.ok(policies);
  }

  /**
   * Get active policy by type (for users to view)
   * GET /api/policies?type=X&active=true
   */
  @GetMapping(params = {"type", "active"})
  public ResponseEntity<PolicyResponse> getActivePolicyByType(
      @RequestParam PolicyType type,
      @RequestParam(defaultValue = "false") boolean active) {
    if (!active) {
      return ResponseEntity.badRequest().build();
    }
    log.info("Get active policy by type: {}", type);
    PolicyResponse policy = policyService.getActivePolicyByType(type);
    return ResponseEntity.ok(policy);
  }

  /**
   * Get policy by ID
   * GET /api/policies/{id}
   */
  @GetMapping("/{id}")
  public ResponseEntity<PolicyResponse> getPolicyById(@PathVariable UUID id) {
    log.info("Get policy by id: {}", id);
    PolicyResponse policy = policyService.getPolicyById(id);
    return ResponseEntity.ok(policy);
  }

  /**
   * Get policy view with acceptance status (for users)
   * GET /api/policies/{id}?view=true&userId=Y
   */
  @GetMapping(value = "/{id}", params = "view")
  public ResponseEntity<PolicyViewResponse> getPolicyView(
      @PathVariable UUID id,
      @RequestParam(required = false) UUID userId) {
    log.info("Get policy view: id={}, userId={}", id, userId);
    PolicyViewResponse view = policyService.getPolicyView(id, userId);
    return ResponseEntity.ok(view);
  }

  /**
   * Update policy by type (for admin)
   * PATCH /api/policies?type=X
   */
  @PatchMapping(params = "type")
  @PreAuthorize("hasAnyRole('SYSTEM_ADMIN')")
  public ResponseEntity<PolicyResponse> updatePolicyByType(
      @RequestParam PolicyType type,
      @Valid @RequestBody UpdatePolicyRequest request) {
    log.info("Update policy by type: {}", type);
    PolicyResponse policy = policyService.updatePolicyByType(type, request);
    return ResponseEntity.ok(policy);
  }

  /**
   * Accept policy (for users)
   * POST /api/policies/{id}/accept
   */
  @PostMapping("/{id}/accept")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> acceptPolicy(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    UUID userId = userPrincipal.getId();
    log.info("Accept policy: id={}, userId={}", id, userId);
    policyService.acceptPolicy(id, userId);
    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}

