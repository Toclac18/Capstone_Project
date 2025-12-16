import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to clean HTML while preserving safe formatting.
 *
 * @param htmlContent Raw HTML content (may contain XSS)
 * @returns Sanitized HTML content safe for rendering
 */
export function sanitizeHtml(htmlContent: string | null | undefined): string {
  if (!htmlContent) {
    return "";
  }

  // Configure DOMPurify to allow safe HTML tags and attributes
  const config = {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "del",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "a", "img", "div", "span"
    ],
    ALLOWED_ATTR: [
      "href", "title", "target", // for <a>
      "src", "alt", "title", "width", "height", // for <img>
      "style", "class" // for general styling
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Remove all event handlers
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: [
      "onclick", "onerror", "onload", "onmouseover", "onmouseout",
      "onfocus", "onblur", "onchange", "onsubmit", "onkeydown", "onkeyup",
      "onkeypress", "onmousedown", "onmouseup", "onmousemove", "onresize",
      "onselect", "onunload", "onabort", "onreset", "oncontextmenu",
      "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave",
      "ondragover", "ondragstart", "ondrop", "onscroll", "onwheel"
    ]
  };

  return DOMPurify.sanitize(htmlContent, config);
}
