package com.capstone.be.config.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to skip automatic response wrapping for specific controller methods or classes.
 * Use this when you need to return raw responses without ApiResponse wrapper.
 *
 * Example use cases:
 * - File downloads
 * - Streaming responses
 * - External API proxy endpoints
 * - Custom response formats
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface NoResponseWrapping {
}
