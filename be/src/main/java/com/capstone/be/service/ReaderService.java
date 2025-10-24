package com.capstone.be.service;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;

public interface ReaderService {

  Reader register(ReaderRegisterRequest request);

  void verifyEmail(String token);
}
