package com.capstone.be.util;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Utility class for sanitizing HTML content to prevent XSS attacks.
 * Used for Policy content sanitization.
 */
@Slf4j
public class HtmlSanitizerUtil {

  /**
   * Whitelist of allowed HTML tags and attributes for Policy content.
   * Allows common formatting tags but blocks scripts, iframes, and event handlers.
   */
  private static final Safelist POLICY_SAFELIST = Safelist.relaxed()
      // Allow common formatting tags
      .addTags("h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "del")
      .addTags("ul", "ol", "li", "blockquote", "pre", "code")
      .addTags("a", "img")
      // Allow common attributes
      .addAttributes("a", "href", "title", "target")
      .addAttributes("img", "src", "alt", "title", "width", "height")
      .addAttributes("p", "style", "class")
      .addAttributes("h1", "style", "class")
      .addAttributes("h2", "style", "class")
      .addAttributes("h3", "style", "class")
      .addAttributes("h4", "style", "class")
      .addAttributes("h5", "style", "class")
      .addAttributes("h6", "style", "class")
      .addAttributes("div", "style", "class")
      .addAttributes("span", "style", "class")
      // Enforce safe URLs for links and images
      .addProtocols("a", "href", "http", "https", "mailto")
      .addProtocols("img", "src", "http", "https", "data")
      // Remove all event handlers (onclick, onerror, etc.)
      .removeAttributes(":all", "onclick", "onerror", "onload", "onmouseover", "onmouseout", 
                        "onfocus", "onblur", "onchange", "onsubmit", "onkeydown", "onkeyup", 
                        "onkeypress", "onmousedown", "onmouseup", "onmousemove", "onresize", 
                        "onselect", "onunload", "onabort", "onreset", "oncontextmenu", 
                        "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", 
                        "ondragover", "ondragstart", "ondrop", "onscroll", "onwheel");

  /**
   * Sanitize HTML content for Policy.
   * Removes dangerous tags (script, iframe, etc.) and event handlers while preserving safe formatting.
   *
   * @param htmlContent Raw HTML content (may contain XSS)
   * @return Sanitized HTML content safe for rendering
   */
  public static String sanitizePolicyContent(String htmlContent) {
    if (htmlContent == null || htmlContent.trim().isEmpty()) {
      return htmlContent;
    }

    try {
      // Use Jsoup to clean HTML based on safelist
      String sanitized = Jsoup.clean(htmlContent, POLICY_SAFELIST);
      
      log.debug("HTML content sanitized. Original length: {}, Sanitized length: {}", 
                htmlContent.length(), sanitized.length());
      
      return sanitized;
    } catch (Exception e) {
      log.error("Error sanitizing HTML content: {}", e.getMessage(), e);
      // If sanitization fails, return empty string to be safe
      return "";
    }
  }

  /**
   * Check if HTML content contains potentially dangerous content.
   *
   * @param htmlContent HTML content to check
   * @return true if content appears safe, false if dangerous patterns detected
   */
  public static boolean isContentSafe(String htmlContent) {
    if (htmlContent == null || htmlContent.trim().isEmpty()) {
      return true;
    }

    try {
      // Check for dangerous patterns
      String lowerContent = htmlContent.toLowerCase();
      
      // Check for script tags
      if (lowerContent.contains("<script") || lowerContent.contains("</script>")) {
        log.warn("Dangerous content detected: script tag");
        return false;
      }
      
      // Check for iframe tags
      if (lowerContent.contains("<iframe") || lowerContent.contains("</iframe>")) {
        log.warn("Dangerous content detected: iframe tag");
        return false;
      }
      
      // Check for javascript: protocol
      if (lowerContent.contains("javascript:")) {
        log.warn("Dangerous content detected: javascript: protocol");
        return false;
      }
      
      // Check for common event handlers
      if (lowerContent.matches(".*on\\w+\\s*=\\s*[\"'].*[\"'].*")) {
        log.warn("Dangerous content detected: event handler");
        return false;
      }
      
      return true;
    } catch (Exception e) {
      log.error("Error checking content safety: {}", e.getMessage(), e);
      return false;
    }
  }
}
