package com.capstone.be.service.impl;

import com.capstone.be.exception.FileStorageException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.service.FileStorageService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class AwsS3FileStorageService implements FileStorageService {

  private final S3Client s3Client;

  @Value("${aws.s3.bucket}")
  private String bucketName;

  @Value("${aws.region}")
  private String region;

  // Max file size: 10MB
  private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Allowed file types for credentials
  private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png"
  );

  @Override
  public String uploadFile(MultipartFile file, String folder, String customFilename) {
    validateFile(file);

    try {
      String filename = customFilename != null
          ? customFilename
          : generateUniqueFilename(file.getOriginalFilename());

      String key = folder + "/" + filename;

      PutObjectRequest putObjectRequest = PutObjectRequest.builder()
          .bucket(bucketName)
          .key(key)
          .contentType(file.getContentType())
          .build();

      s3Client.putObject(
          putObjectRequest,
          RequestBody.fromInputStream(file.getInputStream(), file.getSize())
      );

      String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
          bucketName, region, key);

      log.info("Successfully uploaded file to S3: {}", fileUrl);
      return fileUrl;

    } catch (IOException e) {
      log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
      throw FileStorageException.uploadFailed(file.getOriginalFilename(), e);
    } catch (Exception e) {
      log.error("Unexpected error uploading file: {}", file.getOriginalFilename(), e);
      throw FileStorageException.uploadFailed(file.getOriginalFilename(), e);
    }
  }

  @Override
  public List<String> uploadFiles(List<MultipartFile> files, String folder) {
    List<String> fileUrls = new ArrayList<>();

    for (MultipartFile file : files) {
      String fileUrl = uploadFile(file, folder, null);
      fileUrls.add(fileUrl);
    }

    return fileUrls;
  }

  @Override
  public void deleteFile(String fileUrl) {
    try {
      String key = extractKeyFromUrl(fileUrl);

      DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
          .bucket(bucketName)
          .key(key)
          .build();

      s3Client.deleteObject(deleteObjectRequest);
      log.info("Successfully deleted file from S3: {}", fileUrl);

    } catch (Exception e) {
      log.error("Failed to delete file: {}", fileUrl, e);
      throw FileStorageException.deleteFailed(fileUrl, e);
    }
  }

  @Override
  public void deleteFiles(List<String> fileUrls) {
    for (String fileUrl : fileUrls) {
      try {
        deleteFile(fileUrl);
      } catch (Exception e) {
        log.error("Failed to delete file, continuing with others: {}", fileUrl, e);
      }
    }
  }

  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new InvalidRequestException("File is required and cannot be empty");
    }

    // Check file size
    if (file.getSize() > MAX_FILE_SIZE) {
      throw InvalidRequestException.fileTooLarge(file.getSize(), MAX_FILE_SIZE);
    }

    // Check file type
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
      throw InvalidRequestException.invalidFileType(
          contentType,
          ALLOWED_CONTENT_TYPES.toArray(new String[0])
      );
    }
  }

  private String generateUniqueFilename(String originalFilename) {
    String extension = "";
    if (originalFilename != null && originalFilename.contains(".")) {
      extension = originalFilename.substring(originalFilename.lastIndexOf("."));
    }
    return UUID.randomUUID() + extension;
  }

  private String extractKeyFromUrl(String fileUrl) {
    // Extract key from URL format: https://bucket.s3.region.amazonaws.com/key
    String prefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
    if (fileUrl.startsWith(prefix)) {
      return fileUrl.substring(prefix.length());
    }
    throw new IllegalArgumentException("Invalid S3 URL format: " + fileUrl);
  }
}
