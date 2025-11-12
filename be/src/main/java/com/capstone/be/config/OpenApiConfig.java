package com.capstone.be.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI capstoneOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Capstone API")
            .description("REST API documentation for the Capstone backend services.")
            .version("v1.0.0")
            .contact(new Contact()
                .name("Capstone Team")
                .email("contact@capstone.local")));
  }
}

