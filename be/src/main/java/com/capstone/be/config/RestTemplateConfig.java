package com.capstone.be.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for RestTemplate beans
 */
@Configuration
public class RestTemplateConfig {

  @Bean
  public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder
        .setConnectTimeout(Duration.ofSeconds(30))
        .setReadTimeout(Duration.ofMinutes(5)) // AI processing can take time
        .build();
  }
}
