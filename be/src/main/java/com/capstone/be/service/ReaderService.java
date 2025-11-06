package com.capstone.be.service;

import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.orgAdmin.ChangeAccessRequest;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import org.springframework.data.domain.Page;

public interface ReaderService {

  RegisterReaderResponse register(RegisterReaderRequest request);

  void verifyEmail(String token);

  Page<ReaderResponse> getReaders(Integer page, Integer pageSize, String q, String status);

  ReaderResponse changeAccess(ChangeAccessRequest req);
}
