package com.capstone.be.service.impl;

import com.capstone.be.exception.FileStorageException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.service.FileStorageService;
import java.io.IOException;
import java.time.Duration;
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
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class AwsS3FileStorageService implements FileStorageService {

  private final S3Client s3Client;
  private final S3Presigner s3Presigner;

  @Value("${aws.s3.bucket}")
  private String bucketName;

  @Value("${aws.region}")
  private String region;

  // Max file size: 10MB
  private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Allowed file types for credentials and review reports
  private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword" // .doc
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

      log.info("Successfully uploaded file to S3: {}", key);
      return filename;

    } catch (IOException e) {
      log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
      throw FileStorageException.uploadFailed(file.getOriginalFilename(), e);
    } catch (Exception e) {
      log.error("Unexpected error uploading file: {}", file.getOriginalFilename(), e);
      throw FileStorageException.uploadFailed(file.getOriginalFilename(), e);
    }
  }

  @Override
  public String uploadFile(byte[] content, String contentType, String folder, String filename) {
    try {
      String finalFilename = (filename != null && !filename.isBlank())
          ? filename
          : generateUniqueFilename("dump.png"); //for extension

      String key = folder + "/" + finalFilename;

      PutObjectRequest putObjectRequest = PutObjectRequest.builder()
          .bucket(bucketName)
          .key(key)
          .contentType(contentType)
          .build();

      s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content));

      log.info("Successfully uploaded generated file to S3: {}", key);
      return finalFilename;
    } catch (Exception e) {
      log.error("Failed to upload generated file to S3", e);
      throw new FileStorageException("Failed to upload generated file to S3", e);
    }
  }

  @Override
  public List<String> uploadFiles(List<MultipartFile> files, String folder) {
    List<String> fileKeys = new ArrayList<>();

    for (MultipartFile file : files) {
      String fileUrl = uploadFile(file, folder, null);
      fileKeys.add(fileUrl);
    }

    return fileKeys;
  }

  @Override
  public void deleteFile(String folder, String filename) {
    String key = folder + "/" + filename;
    try {
      DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
          .bucket(bucketName)
          .key(key)
          .build();

      s3Client.deleteObject(deleteObjectRequest);
      log.info("Successfully deleted file from S3: {}", key);

    } catch (Exception e) {
      log.error("Failed to delete file with key: {}", key, e);
      throw FileStorageException.deleteFailed(key, e);
    }
  }

  @Override
  public void deleteFiles(String folder, List<String> filenames) {
    for (String filename : filenames) {
      try {
        deleteFile(folder, filename);
      } catch (Exception e) {
        log.error("Failed to delete file, continuing with others: {}", filename, e);
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

  @Override
  public String generatePresignedUrl(String folder, String filename, int expirationMinutes) {
    try {
      String key = folder + "/" + filename;

      GetObjectRequest getObjectRequest = GetObjectRequest.builder()
          .bucket(bucketName)
          .key(key)
          .build();

      GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
          .signatureDuration(Duration.ofMinutes(expirationMinutes))
          .getObjectRequest(getObjectRequest)
          .build();

      PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

      String url = presignedRequest.url().toString();
      log.info("Generated presigned URL for key: {}, expires in {} minutes", key,
          expirationMinutes);

      return url;
    } catch (Exception e) {
      log.error("Failed to generate presigned URL for {}/{}", folder, filename, e);
      throw new FileStorageException("Failed to generate presigned URL", e);
    }
  }

}
