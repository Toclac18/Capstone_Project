package com.capstone.be.service;

import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.request.orgAdmin.ChangeAccessRequest;
import com.capstone.be.dto.response.auth.ReaderRegisterResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ReaderService {

  ReaderRegisterResponse register(ReaderRegisterRequest request);

  void verifyEmail(String token);

  Page<ReaderResponse> getReaders(Integer page, Integer pageSize, String q, String status);
  ReaderResponse changeAccess(ChangeAccessRequest req);
}
