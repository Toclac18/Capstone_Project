package com.capstone.be.service.impl;

import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.service.ReaderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReaderServiceImpl implements ReaderService {

  private final ReaderRepository readerRepository;
}
