package com.capstone.be.controller;

import com.capstone.be.dto.request.orgAdmin.ChangeAccessRequest;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import com.capstone.be.service.ReaderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/org-admin")
@RequiredArgsConstructor
public class OrgAdminReaderController {

  private final ReaderService readerService;
//
//  /**
//   * Lấy danh sách Reader (phân trang + tìm kiếm + filter trạng thái) Chỉ cho phép admin có
//   * ORGANIZATION
//   */
//  @GetMapping("/readers")
//  @PreAuthorize("hasAuthority('ORGANIZATION')")
//  public ResponseEntity<Page<ReaderResponse>> getReaders(
//      @RequestParam(required = false) Integer page,
//      @RequestParam(required = false) Integer pageSize,
//      @RequestParam(required = false) String q,
//      @RequestParam(required = false, defaultValue = "ALL") String status
//  ) {
//    Page<ReaderResponse> readers = readerService.getReaders(page, pageSize,
//        q, status);
//    return ResponseEntity.ok(readers);
//  }

  /**
   * Thay đổi quyền truy cập của Reader (Active / Deactive)
   */
  @PostMapping("/reader-change-access")
  @PreAuthorize("hasAuthority('ORGANIZATION')")
  public ResponseEntity<ReaderResponse> changeAccess(@RequestBody ChangeAccessRequest req) {
    ReaderResponse res = readerService.changeAccess(req);
    return ResponseEntity.ok(res);
  }
}
