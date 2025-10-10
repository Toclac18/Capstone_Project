package com.capstone.be.service;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.ReaderRegisterRequest;

public interface ReaderService {

  Reader register(ReaderRegisterRequest request);
}
