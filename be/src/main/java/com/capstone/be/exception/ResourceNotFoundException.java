package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a requested resource is not found
 * Maps to HTTP 404 NOT FOUND
 */
public class ResourceNotFoundException extends BusinessException {

  public ResourceNotFoundException(String message) {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND.getCode());
  }

  public ResourceNotFoundException(String resourceName, Object id) {
    super(
        String.format("%s not found with id: %s", resourceName, id),
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND.getCode()
    );
  }

  public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
    super(
        String.format("%s not found with %s: %s", resourceName, fieldName, fieldValue),
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND.getCode()
    );
  }

  // Specific resource not found exceptions
  public static ResourceNotFoundException user(Object id) {
    return new ResourceNotFoundException("User", id);
  }

  public static ResourceNotFoundException userById(Object id) {
    return new ResourceNotFoundException("User", "id", id);
  }

  public static ResourceNotFoundException userByEmail(String email) {
    return new ResourceNotFoundException("User", "email", email);
  }

  public static ResourceNotFoundException document(Object id) {
    return new ResourceNotFoundException("Document", id);
  }

  public static ResourceNotFoundException organization(Object id) {
    return new ResourceNotFoundException("Organization", id);
  }

  public static ResourceNotFoundException profile(Object id) {
    return new ResourceNotFoundException("Profile", id);
  }
}
