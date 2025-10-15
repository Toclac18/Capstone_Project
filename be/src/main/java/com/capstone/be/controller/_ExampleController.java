package com.capstone.be.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/example")
public class _ExampleController {

  // Only ADMIN
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @GetMapping("/1")
  public String method1() {
    return "BUSINESS_ADMIN 's route";
  }

  // READER and REVIEWER can access
  @PreAuthorize("hasAnyRole('READER','REVIEWER')")
  @GetMapping("/2")
  public String method2() {
    return "READER and REVIEWER's route";
  }

}
