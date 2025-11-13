package com.capstone.be.service;

import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.orgAdmin.ChangeAccessRequest;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import com.capstone.be.dto.response.reader.JoinedOrganizationResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReaderService {

  RegisterReaderResponse register(RegisterReaderRequest request);

  void verifyEmail(String token);

//  Page<ReaderResponse> getReaders(Integer page, Integer pageSize, String q, String status);

  Page<ReaderResponse> getReaders(String q, ReaderStatus status, Pageable pageable);

  ReaderResponse changeAccess(ChangeAccessRequest req);

  Page<JoinedOrganizationResponse> getJoinedOrganizations(UUID readerId, Pageable pageable);

}
