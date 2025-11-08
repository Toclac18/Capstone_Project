package com.capstone.be.controller;

import com.capstone.be.dto.base.SuccessResponse;
import com.capstone.be.dto.response.reader.JoinedOrganizationResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReaderService;
import com.capstone.be.util.ExceptionBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readers")
@RequiredArgsConstructor
public class ReaderController {

  private static final int MAX_PAGE_SIZE = 50;

  private final ReaderService readerService;

  @GetMapping("/me/joined-organizations")
  @PreAuthorize("hasRole('READER')")
  public SuccessResponse<Page<JoinedOrganizationResponse>> getJoinedOrganizations(
      @AuthenticationPrincipal UserPrincipal principal,
      @PageableDefault(size = 10, sort = "addedAt", direction = Sort.Direction.DESC)
      Pageable pageable) {

    if (pageable.getPageNumber() < 0) {
      throw ExceptionBuilder.badRequest("Page index must be greater than or equal to 0");
    }
    if (pageable.getPageSize() <= 0 || pageable.getPageSize() > MAX_PAGE_SIZE) {
      throw ExceptionBuilder.badRequest(
          "Page size must be between 1 and " + MAX_PAGE_SIZE);
    }

    Page<JoinedOrganizationResponse> result =
        readerService.getJoinedOrganizations(principal.getId(), pageable);

    return SuccessResponse.of(result);
  }
}
