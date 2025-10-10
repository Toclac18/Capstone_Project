package com.capstone.be.controller;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.ReaderRegisterRequest;
import com.capstone.be.service.ReaderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @Autowired
  ReaderService readerService;

  //SAMPLE API
  @GetMapping("/hello")
  public String Hello() {
    return "Hello world!";
  }

  @PostMapping("/reader/register")
  public Reader readerRegister(
      @Valid @RequestBody ReaderRegisterRequest request) {
    return readerService.register(request);
  }

}
