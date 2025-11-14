//package com.capstone.be.config;
//
//import com.capstone.be.exception.ResourceNotFoundException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.validation.ConstraintViolationException;
//import java.net.URI;
//import java.time.OffsetDateTime;
//import org.springframework.dao.DataIntegrityViolationException;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ProblemDetail;
//import org.springframework.http.ResponseEntity;
//import org.springframework.http.converter.HttpMessageNotReadableException;
//import org.springframework.security.authorization.AuthorizationDeniedException;
//import org.springframework.web.HttpMediaTypeNotSupportedException;
//import org.springframework.web.HttpRequestMethodNotSupportedException;
//import org.springframework.web.bind.MethodArgumentNotValidException;
//import org.springframework.web.bind.annotation.ExceptionHandler;
//import org.springframework.web.bind.annotation.RestControllerAdvice;
//import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
//import org.springframework.web.server.ResponseStatusException;
//
//@RestControllerAdvice
//public class GlobalExceptionHandler {
//
//  @ExceptionHandler(ResourceNotFoundException.class)
//  public ResponseEntity<ProblemDetail> handleResourceNotFound(ResourceNotFoundException ex,
//      HttpServletRequest req) {
//    return buildProblemDetail(HttpStatus.BAD_REQUEST, "Resource not found",
//        ex.getMessage(), "RESOURCE_NOT_FOUND", req);
//  }
//
//  @ExceptionHandler(AuthorizationDeniedException.class)
//  public ResponseEntity<ProblemDetail> handleAuthDenied(AuthorizationDeniedException ex,
//      HttpServletRequest req) {
//    return buildProblemDetail(HttpStatus.UNAUTHORIZED, "Authorization Error",
//        ex.getMessage(), "AUTHORIZATION_ERROR", req);
//  }
//
//  // 422: Body @Valid fail
//  @ExceptionHandler(MethodArgumentNotValidException.class)
//  public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex,
//      HttpServletRequest req) {
//    String msg = ex.getBindingResult().getFieldErrors().stream()
//        .map(e -> e.getField() + ": " + e.getDefaultMessage())
//        .findFirst().orElse("Validation error");
//    return buildProblemDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Validation Error", msg,
//        "VALIDATION_ERROR", req);
//  }
//
//  // 422: Query param @Validated fail
//  @ExceptionHandler(ConstraintViolationException.class)
//  public ResponseEntity<ProblemDetail> handleConstraint(ConstraintViolationException ex,
//      HttpServletRequest req) {
//    String msg = ex.getConstraintViolations().stream()
//        .map(v -> v.getPropertyPath() + ": " + v.getMessage())
//        .findFirst().orElse("Constraint violation");
//    return buildProblemDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Validation Error", msg,
//        "VALIDATION_ERROR", req);
//  }
//
//  // 400: Bad request
//  @ExceptionHandler({
//      IllegalArgumentException.class,
//      MethodArgumentTypeMismatchException.class
//  })
//  public ResponseEntity<ProblemDetail> handleBadRequest(Exception ex, HttpServletRequest req) {
//    return buildProblemDetail(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), "BAD_REQUEST",
//        req);
//  }
//
//  // 405: Wrong method (GET/POST,...)
//  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
//  public ResponseEntity<ProblemDetail> handleMethodNotAllowed(
//      HttpRequestMethodNotSupportedException ex,
//      HttpServletRequest req) {
//    return buildProblemDetail(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed", ex.getMessage(),
//        "METHOD_NOT_ALLOWED", req);
//  }
//
//  // 415: Wrong Content-Type
//  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
//  public ResponseEntity<ProblemDetail> handleUnsupportedMedia(HttpMediaTypeNotSupportedException ex,
//      HttpServletRequest req) {
//    return buildProblemDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type",
//        ex.getMessage(), "UNSUPPORTED_MEDIA_TYPE", req);
//  }
//
//  @ExceptionHandler(DataIntegrityViolationException.class)
//  public ResponseEntity<ProblemDetail> handleDataViolation(DataIntegrityViolationException ex,
//      HttpServletRequest req) {
////    ex.printStackTrace();
//    return buildProblemDetail(HttpStatus.BAD_REQUEST, "Invalid data", ex.getCause().getMessage(),
//        "DATA_VIOLATION", req);
//  }
//
//  // 4xx: ResponseStatusException (throw by Services)
//  @ExceptionHandler(ResponseStatusException.class)
//  public ResponseEntity<ProblemDetail> handleResponseStatus(ResponseStatusException ex,
//      HttpServletRequest req) {
//    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
//    String msg = ex.getReason() != null ? ex.getReason() : "Error";
//    return buildProblemDetail(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR,
//        ex.getStatusCode().toString(), msg, status.name(), req);
//  }
//
//  @ExceptionHandler(HttpMessageNotReadableException.class)
//  public ResponseEntity<ProblemDetail> handleMissingBody(HttpMessageNotReadableException ex,
//      HttpServletRequest req) {
//    return buildProblemDetail(HttpStatus.BAD_REQUEST, "REQUEST BODY ERROR",
//        "Require valid request body", "BAD_REQUEST", req);
//  }
//
//  // 500: System error
//  @ExceptionHandler(Exception.class)
//  public ResponseEntity<ProblemDetail> handleInternal(Exception ex, HttpServletRequest req) {
//    ex.printStackTrace(); //#dev
//    return buildProblemDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
//        ex.getMessage(), "INTERNAL_ERROR", req);
//  }
//
//  /**
//   * Helper: Create ProblemDetail standard RFC 7807 + metadata
//   */
//  private ResponseEntity<ProblemDetail> buildProblemDetail(
//      HttpStatus status,
//      String title,
//      String detail,
//      String code,
//      HttpServletRequest req) {
//
//    ProblemDetail pd = ProblemDetail.forStatus(status);
//    // pd.setType("empty");
//    pd.setTitle(title);
//    pd.setDetail(detail);
//    pd.setInstance(URI.create(req.getRequestURI()));
//
//    // Add custom fields
//    pd.setProperty("timestamp", OffsetDateTime.now());
//    pd.setProperty("code", code);
//
//    return ResponseEntity.status(status).body(pd);
//  }
//}
