package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when file storage operations fail
 * Maps to HTTP 500 INTERNAL SERVER ERROR
 */
public class FileStorageException extends BusinessException {

  public FileStorageException(String message) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.FILE_STORAGE_ERROR.getCode());
  }

  public FileStorageException(String message, Throwable cause) {
    super(
        message,
        cause,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.FILE_STORAGE_ERROR.getCode()
    );
  }

  public FileStorageException(String message, String errorCode) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }

  public FileStorageException(String message, Throwable cause, String errorCode) {
    super(message, cause, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }

  // Specific file storage exceptions
  public static FileStorageException uploadFailed(String filename, Throwable cause) {
    return new FileStorageException(
        String.format("Failed to upload file: %s", filename),
        cause,
        ErrorCode.FILE_UPLOAD_FAILED.getCode()
    );
  }

  public static FileStorageException downloadFailed(String filename, Throwable cause) {
    return new FileStorageException(
        String.format("Failed to download file: %s", filename),
        cause,
        ErrorCode.FILE_DOWNLOAD_FAILED.getCode()
    );
  }

  public static FileStorageException deleteFailed(String filename, Throwable cause) {
    return new FileStorageException(
        String.format("Failed to delete file: %s", filename),
        cause,
        ErrorCode.FILE_DELETE_FAILED.getCode()
    );
  }

  public static FileStorageException fileNotFound(String filename) {
    return new FileStorageException(
        String.format("File not found: %s", filename),
        ErrorCode.FILE_NOT_FOUND.getCode()
    );
  }
}
