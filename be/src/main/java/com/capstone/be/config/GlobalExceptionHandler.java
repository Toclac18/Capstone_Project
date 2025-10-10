package com.capstone.be.config;

import com.capstone.be.dto.base.ApiResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  // 422: Body @Valid fail
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> e.getField() + ": " + e.getDefaultMessage())
        .findFirst().orElse("Validation error");
    return toResponse(HttpStatus.UNPROCESSABLE_ENTITY, msg);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiResponse<Void>> handleConstraint(ConstraintViolationException ex) {
    String msg = ex.getConstraintViolations().stream()
        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
        .findFirst().orElse("Constraint violation");
    return toResponse(HttpStatus.UNPROCESSABLE_ENTITY, msg);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
    return toResponse(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  @ExceptionHandler({
      IllegalArgumentException.class,
      MethodArgumentTypeMismatchException.class,
      MissingServletRequestParameterException.class
  })
  public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception ex) {
    return toResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(
      HttpRequestMethodNotSupportedException ex) {
    return toResponse(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage());
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ApiResponse<Void>> handleUnsupportedMedia(
      HttpMediaTypeNotSupportedException ex) {
    return toResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Void>> handleForbidden(AccessDeniedException ex) {
    return toResponse(HttpStatus.FORBIDDEN, "Access denied");
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex) {
    HttpStatusCode status = ex.getStatusCode();
    String msg = (ex.getReason() != null) ? ex.getReason() : "Error";
    return toResponse(status, msg);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleAny(Exception ex) {
    return toResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
  }

  private ResponseEntity<ApiResponse<Void>> toResponse(HttpStatusCode status, String message) {
    String code = (status instanceof HttpStatus hs) ? hs.name() : String.valueOf(status.value());
    ApiResponse<Void> body = ApiResponse.fail(message, "path", "code", null);
    return ResponseEntity.status(status).body(body);
  }
}
