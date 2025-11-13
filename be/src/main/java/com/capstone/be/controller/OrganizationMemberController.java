package com.capstone.be.controller;

import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.base.PageMeta;
import com.capstone.be.dto.base.SuccessResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import com.capstone.be.repository.OrganizationEnrollmentRepository;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReaderService;
import com.capstone.be.util.ExceptionBuilder;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationMemberController {

  private final ReaderService readerService;
  private final OrganizationEnrollmentRepository enrollmentRepository;

  /**
   * Lấy danh sách Reader (phân trang + tìm kiếm + filter trạng thái) Chỉ cho phép admin có
   * ORGANIZATION
   */
  @GetMapping("/{id}/readers")
  @PreAuthorize("hasRole('ORGANIZATION')")
  public SuccessResponse<List<ReaderResponse>> getReaders(
      @PathVariable("id") UUID orgId,
      @RequestParam(required = false, name = "q") String q,
      @RequestParam(required = false, name = "status") ReaderStatus status,
      @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
      @AuthenticationPrincipal UserPrincipal userPrincipal
  ) {
    System.out.println(userPrincipal);
    if (!userPrincipal.getId().equals(orgId)) {
      throw ExceptionBuilder.unauthorized("You are unauthorized for this Org");
    }

    var result = enrollmentRepository.findMembersByOrganization(orgId, status, q, pageable);
    PageMeta pageMeta = PageMeta.from(result);
    return SuccessResponse.of(result.getContent(), pageMeta);
  }


}
