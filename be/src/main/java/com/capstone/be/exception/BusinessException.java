package com.capstone.be.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base exception for all business logic exceptions
 * All custom exceptions should extend this class
 */
@Getter
public class BusinessException extends RuntimeException {

  private final HttpStatus status;
  private final String errorCode;

  public BusinessException(String message) {
    super(message);
    this.status = HttpStatus.BAD_REQUEST;
    this.errorCode = "BUSINESS_ERROR";
  }

  public BusinessException(String message, HttpStatus status) {
    super(message);
    this.status = status;
    this.errorCode = "BUSINESS_ERROR";
  }

  public BusinessException(String message, HttpStatus status, String errorCode) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }

  public BusinessException(String message, Throwable cause) {
    super(message, cause);
    this.status = HttpStatus.BAD_REQUEST;
    this.errorCode = "BUSINESS_ERROR";
  }

  public BusinessException(String message, Throwable cause, HttpStatus status, String errorCode) {
    super(message, cause);
    this.status = status;
    this.errorCode = errorCode;
  }
}
