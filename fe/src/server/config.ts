// server/config.ts
// Common backend configuration for API routes
export const DEFAULT_BE_BASE = "http://localhost:8081";

/**
 * Unified backend base URL resolution.
 * Priority
 z  - NEXT_PUBLIC_API_BASE_URL
 *  - DEFAULT_BE_BASE
 */
export const BE_BASE: string = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BE_BASE
).replace(/\/+$/, "");

// Cookie name for JWT – must match what BE sets
export const COOKIE_NAME = process.env.COOKIE_NAME || "access-token";

// Global mock toggle (used by some routes)
export const USE_MOCK = process.env.USE_MOCK === "true";
