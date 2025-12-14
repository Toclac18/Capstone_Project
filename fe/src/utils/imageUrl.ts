/**
 * Sanitizes and normalizes image URLs from various sources (S3, local paths, etc.)
 * @param url - The URL to sanitize
 * @param baseUrl - Base URL to prepend if the URL is a relative path
 * @param fallbackUrl - Fallback URL if sanitization fails (default: null)
 * @returns Sanitized URL with cache busting parameter, or fallback/null
 */
export function sanitizeImageUrl(
  url: string | null | undefined,
  baseUrl?: string,
  fallbackUrl: string | null = null
): string | null {
  if (!url || typeof url !== "string") {
    return fallbackUrl;
  }

  const cleaned = url.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!cleaned) {
    return fallbackUrl;
  }

  // Already a full URL
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const urlObj = new URL(cleaned);
      return `${urlObj.toString()}?t=${Date.now()}`;
    } catch {
      return fallbackUrl;
    }
  }

  // S3 URL without protocol
  if (cleaned.includes("s3.amazonaws.com")) {
    try {
      const urlObj = new URL(cleaned);
      return `${urlObj.toString()}?t=${Date.now()}`;
    } catch {
      try {
        const urlObj = new URL(`https://${cleaned}`);
        return `${urlObj.toString()}?t=${Date.now()}`;
      } catch {
        return fallbackUrl;
      }
    }
  }

  // Relative path - prepend baseUrl if provided
  if (baseUrl) {
    const path = cleaned.startsWith("/") ? cleaned.slice(1) : cleaned;
    try {
      const fullUrl = `${baseUrl}${path}`;
      new URL(fullUrl);
      return `${fullUrl}?t=${Date.now()}`;
    } catch {
      return fallbackUrl;
    }
  }

  return fallbackUrl;
}

