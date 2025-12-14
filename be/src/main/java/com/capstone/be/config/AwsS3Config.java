package com.capstone.be.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.Assert;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsS3Config {

  @Value("${aws.accessKeyId}")
  private String accessKeyId;

  @Value("${aws.secretKey}")
  private String secretKey;

  @Value("${aws.region}")
  private String region;

  @Bean
  public S3Client s3Client() {
    Assert.hasText(accessKeyId, "AWS access key must not be blank");
    Assert.hasText(secretKey, "AWS secret key must not be blank");
    Assert.hasText(region, "AWS region must not be blank");

    return S3Client.builder()
        .credentialsProvider(
            StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretKey)))
        .region(Region.of(region))
        .build();
  }

  @Bean
  public S3Presigner s3Presigner() {
    Assert.hasText(accessKeyId, "AWS access key must not be blank");
    Assert.hasText(secretKey, "AWS secret key must not be blank");
    Assert.hasText(region, "AWS region must not be blank");

    return S3Presigner.builder()
        .credentialsProvider(
            StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretKey)))
        .region(Region.of(region))
        .build();
  }
}
