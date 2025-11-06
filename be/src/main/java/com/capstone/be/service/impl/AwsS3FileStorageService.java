package com.capstone.be.service.impl;

import com.capstone.be.service.FileStorageService;
import com.capstone.be.util.ExceptionBuilder;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class AwsS3FileStorageService implements FileStorageService {

  private static final String REVIEWER_PREFIX = "reviewers";

  private final S3Client s3Client;

  @Value("${aws.s3.bucket}")
  private String bucketName;

  @Override
  public List<String> uploadReviewerBackground(UUID reviewerId, List<MultipartFile> files) {
    if (CollectionUtils.isEmpty(files)) {
      return List.of();
    }

    if (!StringUtils.hasText(bucketName)) {
      log.error("AWS S3 bucket name is not configured");
      throw ExceptionBuilder.internalServerError("S3 bucket is not configured");
    }

    List<String> uploadedKeys = new ArrayList<>();
    for (MultipartFile file : files) {
      if (file == null || file.isEmpty()) {
        continue;
      }

      String key = buildReviewerObjectKey(reviewerId, file);

      try {
        PutObjectRequest request = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .contentType(file.getContentType())
            .build();

        s3Client.putObject(request,
            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        uploadedKeys.add(key);
      } catch (IOException | SdkException ex) {
        log.error("Failed to upload file '{}' for reviewer {}", file.getOriginalFilename(),
            reviewerId, ex);
        throw ExceptionBuilder.internalServerError("Failed to upload reviewer background files");
      }
    }

    return uploadedKeys;
  }

  private String buildReviewerObjectKey(UUID reviewerId, MultipartFile file) {
    String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "file");
    String cleanedName = sanitizeFileName(originalName);
    long timestamp = Instant.now().toEpochMilli();
    return String.format("%s/%s/background/%d-%s", REVIEWER_PREFIX, reviewerId, timestamp,
        cleanedName);
  }

  private String sanitizeFileName(String fileName) {
    String name = StringUtils.getFilename(fileName);
    if (!StringUtils.hasText(name)) {
      return UUID.randomUUID() + ".dat";
    }
    return name.replaceAll("[^A-Za-z0-9._-]", "_");
  }
}
