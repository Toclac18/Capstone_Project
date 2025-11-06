package com.capstone.be.service;

import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.response.auth.ReaderRegisterResponse;

public interface ReaderService {

    ReaderRegisterResponse register(ReaderRegisterRequest request);

    void verifyEmail(String token);
}
