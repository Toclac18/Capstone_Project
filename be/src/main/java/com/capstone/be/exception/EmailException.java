package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when email operations fail
 * Maps to HTTP 500 INTERNAL SERVER ERROR
 */
public class EmailException extends BusinessException {

  public EmailException(String message) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.EMAIL_SEND_FAILED.getCode());
  }

  public EmailException(String message, Throwable cause) {
    super(
        message,
        cause,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.EMAIL_SEND_FAILED.getCode()
    );
  }

  public EmailException(String message, String errorCode) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }

  public EmailException(String message, Throwable cause, String errorCode) {
    super(message, cause, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }

  // Specific email exceptions
  public static EmailException sendFailed(String recipient, Throwable cause) {
    return new EmailException(
        String.format("Failed to send email to: %s", recipient),
        cause,
        ErrorCode.EMAIL_SEND_FAILED.getCode()
    );
  }

  public static EmailException templateError(String templateName, Throwable cause) {
    return new EmailException(
        String.format("Error processing email template: %s", templateName),
        cause,
        ErrorCode.EMAIL_TEMPLATE_ERROR.getCode()
    );
  }

  public static EmailException templateError(String templateName) {
    return new EmailException(
        String.format("Email template not found or invalid: %s", templateName),
        ErrorCode.EMAIL_TEMPLATE_ERROR.getCode()
    );
  }
}
