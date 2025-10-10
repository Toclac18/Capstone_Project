package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.ReaderRegisterRequest;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ReaderServiceImpl implements ReaderService {

  @Autowired
  private ReaderRepository readerRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Override
  public Reader register(ReaderRegisterRequest request) {
    // Check email existed
    if (readerRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new RuntimeException("Email has been used");
    }

    // Create Reader Entity From Dto
    System.out.println(request);
    Reader reader = new Reader();
    reader.setUsername(request.getUsername());
    reader.setEmail(request.getEmail());
    reader.setPasswordHash(passwordEncoder.encode(request.getPassword()));

    // Save Reader to DB
    return readerRepository.save(reader);
  }
}
