package com.capstone.be.config;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.EmailException;
import com.capstone.be.exception.FileStorageException;
import com.capstone.be.exception.ForbiddenException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Global exception handler that catches all exceptions and wraps them in ApiResponse format
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  // ========== Custom Business Exceptions ==========

  /**
   * Handle all custom business exceptions
   */
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResponse<Object>> handleBusinessException(
      BusinessException ex, HttpServletRequest req) {
    log.error("Business exception at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    ApiResponse<Object> response = ApiResponse.builder()
        .success(false)
        .message(ex.getMessage())
        .build();

    // Add error code to response data
    Map<String, String> errorDetails = new HashMap<>();
    errorDetails.put("errorCode", ex.getErrorCode());
    response.setData(errorDetails);

    return ResponseEntity.status(ex.getStatus()).body(response);
  }

  /**
   * Handle ResourceNotFoundException (404)
   */
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(
      ResourceNotFoundException ex, HttpServletRequest req) {
    log.error("Resource not found at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
  }

  /**
   * Handle DuplicateResourceException (409)
   */
  @ExceptionHandler(DuplicateResourceException.class)
  public ResponseEntity<ApiResponse<Object>> handleDuplicateResource(
      DuplicateResourceException ex, HttpServletRequest req) {
    log.error("Duplicate resource at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
  }

  /**
   * Handle UnauthorizedException (401)
   */
  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiResponse<Object>> handleUnauthorized(
      UnauthorizedException ex, HttpServletRequest req) {
    log.error("Unauthorized at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
  }

  /**
   * Handle ForbiddenException (403)
   */
  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiResponse<Object>> handleForbidden(
      ForbiddenException ex, HttpServletRequest req) {
    log.error("Forbidden at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
  }

  /**
   * Handle InvalidRequestException (400)
   */
  @ExceptionHandler(InvalidRequestException.class)
  public ResponseEntity<ApiResponse<Object>> handleInvalidRequest(
      InvalidRequestException ex, HttpServletRequest req) {
    log.error("Invalid request at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle FileStorageException (500)
   */
  @ExceptionHandler(FileStorageException.class)
  public ResponseEntity<ApiResponse<Object>> handleFileStorage(
      FileStorageException ex, HttpServletRequest req) {
    log.error("File storage error at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode(), ex);

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  /**
   * Handle EmailException (500)
   */
  @ExceptionHandler(EmailException.class)
  public ResponseEntity<ApiResponse<Object>> handleEmail(
      EmailException ex, HttpServletRequest req) {
    log.error("Email error at {}: {} (code: {})",
        req.getRequestURI(), ex.getMessage(), ex.getErrorCode(), ex);

    ApiResponse<Object> response = createErrorResponse(ex.getMessage(), ex.getErrorCode());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  // ========== Spring Security Exceptions ==========

  /**
   * Handle authentication errors (401)
   */
  @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
  public ResponseEntity<ApiResponse<Object>> handleAuthentication(
      Exception ex, HttpServletRequest req) {
    log.error("Authentication error at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        ex.getMessage() != null ? ex.getMessage() : "Authentication failed"
    );

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
  }

  /**
   * Handle authorization errors (403)
   */
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Object>> handleAccessDenied(
      AccessDeniedException ex, HttpServletRequest req) {
    log.error("Access denied at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        "You don't have permission to access this resource"
    );

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
  }

  /**
   * Handle validation errors (422) - @Valid on request body
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {
    log.error("Validation error at {}", req.getRequestURI());

    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error ->
        errors.put(error.getField(), error.getDefaultMessage())
    );

    ApiResponse<Map<String, String>> response = ApiResponse.error(
        "Validation failed",
        errors
    );

    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
  }

  /**
   * Handle constraint violations (422) - @Validated on query params
   */
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraint(
      ConstraintViolationException ex, HttpServletRequest req) {
    log.error("Constraint violation at {}", req.getRequestURI());

    Map<String, String> errors = new HashMap<>();
    ex.getConstraintViolations().forEach(violation ->
        errors.put(violation.getPropertyPath().toString(), violation.getMessage())
    );

    ApiResponse<Map<String, String>> response = ApiResponse.error(
        "Validation failed",
        errors
    );

    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
  }

  /**
   * Handle bad request errors (400)
   */
  @ExceptionHandler({
      IllegalArgumentException.class,
      MethodArgumentTypeMismatchException.class
  })
  public ResponseEntity<ApiResponse<Object>> handleBadRequest(
      Exception ex, HttpServletRequest req) {
    log.error("Bad request at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        ex.getMessage() != null ? ex.getMessage() : "Bad request"
    );

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle missing request parameter (400)
   */
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiResponse<Object>> handleMissingParameter(
      MissingServletRequestParameterException ex, HttpServletRequest req) {
    log.error("Missing request parameter at {}: {}", req.getRequestURI(), ex.getMessage());

    String message = String.format("Required parameter '%s' is missing", ex.getParameterName());
    ApiResponse<Object> response = ApiResponse.error(message);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle missing multipart file (400)
   */
  @ExceptionHandler(MissingServletRequestPartException.class)
  public ResponseEntity<ApiResponse<Object>> handleMissingFile(
      MissingServletRequestPartException ex, HttpServletRequest req) {
    log.error("Missing file upload at {}: {}", req.getRequestURI(), ex.getMessage());

    String message = String.format("Required file '%s' is missing", ex.getRequestPartName());
    ApiResponse<Object> response = ApiResponse.error(message);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle multipart exception (400) - when request is not multipart/form-data
   */
  @ExceptionHandler(MultipartException.class)
  public ResponseEntity<ApiResponse<Object>> handleMultipartException(
      MultipartException ex, HttpServletRequest req) {
    log.error("Multipart exception at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        "Request must be multipart/form-data with a file"
    );

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle method not allowed (405)
   */
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiResponse<Object>> handleMethodNotAllowed(
      HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
    log.error("Method not allowed at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        String.format("Method %s is not supported for this endpoint", ex.getMethod())
    );

    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
  }

  /**
   * Handle unsupported media type (415)
   */
  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ApiResponse<Object>> handleUnsupportedMedia(
      HttpMediaTypeNotSupportedException ex, HttpServletRequest req) {
    log.error("Unsupported media type at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        "Unsupported media type. Please use application/json"
    );

    return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(response);
  }

  /**
   * Handle data integrity violations (400)
   */
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiResponse<Object>> handleDataViolation(
      DataIntegrityViolationException ex, HttpServletRequest req) {
    log.error("Data integrity violation at {}: {}", req.getRequestURI(), ex.getMessage());

    String message = "Data integrity violation";
    if (ex.getMessage() != null) {
      if (ex.getMessage().contains("duplicate key") || ex.getMessage().contains("unique")) {
        message = "This record already exists";
      } else if (ex.getMessage().contains("foreign key")) {
        message = "Related record not found";
      }
    }

    ApiResponse<Object> response = ApiResponse.error(message);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle ResponseStatusException thrown by services
   */
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiResponse<Object>> handleResponseStatus(
      ResponseStatusException ex, HttpServletRequest req) {
    log.error("Response status exception at {}: {}", req.getRequestURI(), ex.getMessage());

    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    String message = ex.getReason() != null ? ex.getReason() : "An error occurred";

    ApiResponse<Object> response = ApiResponse.error(message);
    return ResponseEntity.status(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR)
        .body(response);
  }

  /**
   * Handle missing or invalid request body (400)
   */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiResponse<Object>> handleMissingBody(
      HttpMessageNotReadableException ex, HttpServletRequest req) {
    log.error("Invalid request body at {}: {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        "Invalid or missing request body"
    );

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiResponse<Object>> handleNoResourceFound(
      NoResourceFoundException ex, HttpServletRequest req) {
    log.error("No Resource Found {} : {}", req.getRequestURI(), ex.getMessage());

    ApiResponse<Object> response = ApiResponse.error(
        ex.getMessage()
    );

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  /**
   * Handle all other exceptions (500)
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleInternal(
      Exception ex, HttpServletRequest req) {
    log.error("Internal server error at {}: {}", req.getRequestURI(), ex.getMessage(), ex);

    ApiResponse<Object> response = ApiResponse.error(
        "An internal server error occurred. Please try again later."
    );

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  // ========== Helper Methods ==========

  /**
   * Create error response with error code
   */
  private ApiResponse<Object> createErrorResponse(String message, String errorCode) {
    ApiResponse<Object> response = ApiResponse.builder()
        .success(false)
        .message(message)
        .build();

    Map<String, String> errorDetails = new HashMap<>();
    errorDetails.put("errorCode", errorCode);
    response.setData(errorDetails);

    return response;
  }
}
