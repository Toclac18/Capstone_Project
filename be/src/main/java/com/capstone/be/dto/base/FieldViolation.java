package com.capstone.be.dto.base;

public record FieldViolation(String field, String message, Object rejectedValue) {

}
