"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link, Eye, Code } from "lucide-react";
import { sanitizeHtml } from "@/utils/htmlSanitizer";
import styles from "./styles.module.css";

interface PolicyEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PolicyEditor({
  value,
  onChange,
  error,
  disabled = false,
}: PolicyEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (tag: string) => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (!selectedText) {
      // Insert tag at cursor
      const newValue = value.substring(0, start) + `<${tag}></${tag}>` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
      }, 0);
      return;
    }

    // Wrap selected text
    let newValue = "";
    if (tag === "strong") {
      newValue = value.substring(0, start) + `<strong>${selectedText}</strong>` + value.substring(end);
    } else if (tag === "em") {
      newValue = value.substring(0, start) + `<em>${selectedText}</em>` + value.substring(end);
    } else if (tag === "u") {
      newValue = value.substring(0, start) + `<u>${selectedText}</u>` + value.substring(end);
    } else if (tag === "h2") {
      newValue = value.substring(0, start) + `<h2>${selectedText}</h2>` + value.substring(end);
    } else if (tag === "h3") {
      newValue = value.substring(0, start) + `<h3>${selectedText}</h3>` + value.substring(end);
    } else if (tag === "p") {
      newValue = value.substring(0, start) + `<p>${selectedText}</p>` + value.substring(end);
    } else if (tag === "ul") {
      newValue = value.substring(0, start) + `<ul><li>${selectedText}</li></ul>` + value.substring(end);
    } else if (tag === "ol") {
      newValue = value.substring(0, start) + `<ol><li>${selectedText}</li></ol>` + value.substring(end);
    } else {
      newValue = value.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + value.substring(end);
    }
    
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      const newStart = start + (tag === "ul" || tag === "ol" ? tag.length + 7 : tag.length + 2);
      const newEnd = newStart + selectedText.length;
      textarea.setSelectionRange(newEnd, newEnd);
    }, 0);
  };

  const handleLink = () => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const url = prompt("Enter URL:", selectedText || "https://");
    if (!url) return;

    const linkText = selectedText || url;
    const newValue = value.substring(0, start) + `<a href="${url}">${linkText}</a>` + value.substring(end);
    onChange(newValue);
  };

  return (
    <div className={styles.editorWrapper}>
      {/* Toolbar */}
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => handleFormat("h2")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => handleFormat("h3")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Heading 3"
          >
            H3
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => handleFormat("strong")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Bold"
          >
            <Bold className={styles.toolbarIcon} />
          </button>
          <button
            type="button"
            onClick={() => handleFormat("em")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Italic"
          >
            <Italic className={styles.toolbarIcon} />
          </button>
          <button
            type="button"
            onClick={() => handleFormat("u")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Underline"
          >
            <Underline className={styles.toolbarIcon} />
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => handleFormat("ul")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Bullet List"
          >
            <List className={styles.toolbarIcon} />
          </button>
          <button
            type="button"
            onClick={() => handleFormat("ol")}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className={styles.toolbarIcon} />
          </button>
          <button
            type="button"
            onClick={handleLink}
            className={styles.toolbarButton}
            disabled={disabled}
            title="Insert Link"
          >
            <Link className={styles.toolbarIcon} />
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`${styles.toolbarButton} ${showPreview ? styles.toolbarButtonActive : ""}`}
            disabled={disabled}
            title="Toggle Preview"
          >
            <Eye className={styles.toolbarIcon} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className={styles.editorContainer}>
        {showPreview ? (
          <div
            className={`${styles.editorPreview} ${error ? styles.editorError : ""}`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || "<p>No content</p>") }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${styles.editorTextarea} ${error ? styles.editorError : ""}`}
            placeholder="Enter policy content (HTML supported)..."
            rows={15}
          />
        )}
      </div>

      {error && <span className={styles.editorErrorMessage}>{error}</span>}
      
      {!showPreview && (
        <div className={styles.editorHint}>
          <Code className={styles.hintIcon} />
          <span>Tip: Select text and click format buttons, or type HTML directly</span>
        </div>
      )}
    </div>
  );
}

