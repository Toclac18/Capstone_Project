"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, AlertCircle, Plus, FileText, Building2, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  fetchDocumentTypes,
  fetchDomains,
  fetchTags,
  fetchSpecializations,
  uploadDocument,
  type DocumentType,
  type Domain,
  type Tag,
  type Specialization,
} from "./api";
import { getMyOrganizations, type OrganizationSummary } from "@/services/organizations.service";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import mammoth from "mammoth";
import styles from "./styles.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function UploadDocumentPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const typeIdRef = useRef<HTMLSelectElement>(null);
  const domainRef = useRef<HTMLSelectElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);

  // Form data
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [typeId, setTypeId] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  // Options
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [orgLogoErrors, setOrgLogoErrors] = useState<Set<string>>(new Set());
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxError, setDocxError] = useState<string | null>(null);

  const LOGO_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/org-logos/";

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [types, domainsData, tagsData, orgsData] = await Promise.all([
          fetchDocumentTypes(),
          fetchDomains(),
          fetchTags(),
          getMyOrganizations().catch(() => ({ items: [], total: 0 })), // Ignore errors if user has no orgs
        ]);
        setDocumentTypes(types);
        setDomains(domainsData);
        setTags(tagsData);
        setOrganizations(orgsData.items);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load options";
        setError(msg);
        showToast({
          type: "error",
          title: "Load Failed",
          message: msg,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, [showToast]);

  // Fetch specializations when domain changes
  useEffect(() => {
    if (selectedDomainId) {
      const loadSpecializations = async () => {
        try {
          const results = await fetchSpecializations([selectedDomainId]);
          setSpecializations(results);
          // Reset specialization if current one doesn't belong to selected domain
          if (selectedSpecializationId && !results.some((s) => s.id === selectedSpecializationId)) {
            setSelectedSpecializationId("");
          }
        } catch {
          // Ignore errors
        }
      };
      loadSpecializations();
    } else {
      setSpecializations([]);
      setSelectedSpecializationId("");
    }
  }, [selectedDomainId, selectedSpecializationId]);

  // Load tags (no search param)
  useEffect(() => {
    const loadTags = async () => {
        try {
        const results = await fetchTags();
          setTags(results);
        if (tagSearch.trim()) {
          setShowTagDropdown(true);
        }
        } catch {
        // Ignore errors
        }
      };
    loadTags();
  }, [tagSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagDropdown]);

  // Cleanup file preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (filePreview) {
        // For blob URLs, revoke them
        if (filePreview.startsWith("blob:")) {
          URL.revokeObjectURL(filePreview);
        }
        // For data URLs, no need to revoke as they are base64 encoded
      }
    };
  }, [filePreview]);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Helper function to get file type display name
  const getFileTypeName = (type: string): string => {
    if (type === "application/pdf") return "PDF";
    if (type === "application/msword") return "DOC";
    if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX";
    return type;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type (PDF and DOCX only)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrors({
        ...errors,
        file: "Please upload a PDF or DOCX document only",
      });
      showToast({
        type: "error",
        title: "Invalid file type",
        message: "Only PDF and DOCX files are supported.",
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      const errorMsg = "File size must be less than 10MB";
      setErrors({
        ...errors,
        file: errorMsg,
      });
      showToast({
        type: "error",
        title: "File Too Large",
        message: errorMsg,
        duration: 5000,
      });
      return;
    }

    // Cleanup previous preview if exists
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }

    // Store file info
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);
    setFileType(selectedFile.type);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Auto-fill title from filename
    setFileSelected(true);
    setPdfError(null);
    setNumPages(null);
    setDocxHtml(null);
    setDocxError(null);
    
    // Generate preview for PDF (create blob URL for better performance)
    if (selectedFile.type === "application/pdf") {
      // Create blob URL for PDF preview
      const blobUrl = URL.createObjectURL(selectedFile);
      setFilePreview(blobUrl);
    } else if (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Preview DOCX using mammoth
      setFilePreview(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value);
          setDocxError(null);
        } catch (error) {
          console.error("DOCX conversion error:", error);
          setDocxError("Failed to preview DOCX file");
          setDocxHtml(null);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      // For DOC (old format) or other file types, no preview available
      setFilePreview(null);
      setDocxHtml(null);
      setDocxError(null);
    }
    
    if (errors.file) {
      setErrors({ ...errors, file: "" });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    // Validate file type (PDF and DOCX only)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(droppedFile.type)) {
      setErrors({
        ...errors,
        file: "Please upload a PDF or DOCX document only",
      });
      showToast({
        type: "error",
        title: "Invalid file type",
        message: "Only PDF and DOCX files are supported.",
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 10MB)
    if (droppedFile.size > 10 * 1024 * 1024) {
      const errorMsg = "File size must be less than 10MB";
      setErrors({
        ...errors,
        file: errorMsg,
      });
      showToast({
        type: "error",
        title: "File Too Large",
        message: errorMsg,
        duration: 5000,
      });
      return;
    }

    // Cleanup previous preview if exists
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }

    // Store file info
    setFile(droppedFile);
    setFileName(droppedFile.name);
    setFileSize(droppedFile.size);
    setFileType(droppedFile.type);
    setTitle(droppedFile.name.replace(/\.[^/.]+$/, "")); // Auto-fill title from filename
    setFileSelected(true);
    setPdfError(null);
    setNumPages(null);
    setDocxHtml(null);
    setDocxError(null);
    
    // Generate preview for PDF (create blob URL for better performance)
    if (droppedFile.type === "application/pdf") {
      // Create blob URL for PDF preview
      const blobUrl = URL.createObjectURL(droppedFile);
      setFilePreview(blobUrl);
    } else if (droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Preview DOCX using mammoth
      setFilePreview(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value);
          setDocxError(null);
        } catch (error) {
          console.error("DOCX conversion error:", error);
          setDocxError("Failed to preview DOCX file");
          setDocxHtml(null);
        }
      };
      reader.readAsArrayBuffer(droppedFile);
    } else {
      // For DOC (old format) or other file types, no preview available
      setFilePreview(null);
      setDocxHtml(null);
      setDocxError(null);
    }
    
    if (errors.file) {
      setErrors({ ...errors, file: "" });
    }
  };

  const handleAddNewTag = () => {
    const tag = newTagInput.trim();
    if (tag && !newTags.includes(tag)) {
      setNewTags([...newTags, tag]);
      setNewTagInput("");
    }
  };

  const handleRemoveNewTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    setSelectedSpecializationId(""); // Reset specialization when domain changes
  };

  const handleVisibilityChange = (newVisibility: "PUBLIC" | "INTERNAL") => {
    setVisibility(newVisibility);
    if (newVisibility === "PUBLIC") {
      setSelectedOrganizationId("");
    }
  };

  const handleOrgLogoError = (orgId: string) => {
    setOrgLogoErrors((prev) => new Set(prev).add(orgId));
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setShowTagDropdown(false);
    setTagSearch("");
  };

  const validateForm = (): { isValid: boolean; firstErrorField: string | null; firstErrorMessage: string | null } => {
    const newErrors: Record<string, string> = {};

    if (!file) {
      newErrors.file = "File is required";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length > 40) {
      newErrors.title = "Title must be 40 characters or less";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length > 100) {
      newErrors.description = "Description must be 100 characters or less";
    }

    if (!typeId) {
      newErrors.typeId = "Document type is required";
    }

    if (!selectedDomainId) {
      newErrors.domain = "Domain is required";
    }

    if (!selectedSpecializationId) {
      newErrors.specialization = "Specialization is required";
    }

    if (visibility === "INTERNAL") {
      if (organizations.length === 0) {
        newErrors.visibility = "You must be a member of at least one organization to upload internal documents";
      } else if (!selectedOrganizationId) {
        newErrors.organization = "Please select an organization for internal documents";
      }
    }

    setErrors(newErrors);
    
    // Get first error field and message
    const firstErrorField = Object.keys(newErrors)[0] || null;
    const firstErrorMessage = firstErrorField ? newErrors[firstErrorField] : null;
    
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorField,
      firstErrorMessage,
    };
  };

  const clearFormFields = () => {
    // Only clear form fields, keep file
    setTitle("");
    setDescription("");
    setVisibility("PUBLIC");
    setTypeId("");
    setSelectedDomainId("");
    setSelectedSpecializationId("");
    setSelectedTagIds([]);
    setNewTags([]);
    setNewTagInput("");
    setTagSearch("");
    setShowTagDropdown(false);
    setSelectedOrganizationId("");
    setErrors({});
    setError(null);
  };

  const resetForm = () => {
    // Cleanup preview URL
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }

    // Reset all form fields
    setFile(null);
    setFilePreview(null);
    setFileName("");
    setFileSize(0);
    setFileType("");
    setTitle("");
    setFileSelected(false);
    setDescription("");
    setVisibility("PUBLIC");
    setTypeId("");
    setSelectedDomainId("");
    setSelectedSpecializationId("");
    setSelectedTagIds([]);
    setNewTags([]);
    setNewTagInput("");
    setTagSearch("");
    setShowTagDropdown(false);
    setSelectedOrganizationId("");
    setErrors({});
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    
    if (!validation.isValid) {
      // Focus vào field đầu tiên bị lỗi
      if (validation.firstErrorField === "file") {
        fileInputRef.current?.click();
      } else if (validation.firstErrorField === "title") {
        titleRef.current?.focus();
      } else if (validation.firstErrorField === "description") {
        descriptionRef.current?.focus();
      } else if (validation.firstErrorField === "typeId") {
        typeIdRef.current?.focus();
      } else if (validation.firstErrorField === "domain") {
        domainRef.current?.focus();
      }
      
      // Hiện toast lỗi
      if (validation.firstErrorMessage) {
        showToast({
          type: "error",
          title: "Validation Error",
          message: validation.firstErrorMessage,
          duration: 5000,
        });
      }
      
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const result = await uploadDocument({
        file: file!,
        title: title.trim(),
        description: description.trim(),
        visibility,
        typeId,
        domainIds: [selectedDomainId],
        specializationIds: selectedSpecializationId ? [selectedSpecializationId] : [],
        tagIds: selectedTagIds,
        tags: tags, // Pass tags list to map tagIds to tagCodes
        newTags: newTags.length > 0 ? newTags : undefined,
        organizationId: visibility === "INTERNAL" ? selectedOrganizationId : undefined,
      });

      showToast({
        type: "success",
        title: "Upload Successful",
        message: result.message || "Your document has been uploaded successfully.",
        duration: 3000,
      });

      // Reset form
      resetForm();

      // Redirect to documents list after 2 seconds
      setTimeout(() => {
        router.push("/reader/documents");
      }, 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to upload document";
      setError(msg);
      showToast({
        type: "error",
        title: "Upload Failed",
        message: msg,
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles["page-container"]}>
      <Breadcrumb pageName="Upload Document" />

      {loading && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}


      {!loading && !fileSelected && (
        <div className={styles["pre-upload-container"]}>
          <div className={styles["pre-upload-content"]}>
            <h1 className={styles["pre-upload-title"]}>
              Contribute to the collection
            </h1>
            <p className={styles["pre-upload-description"]}>
              Someone out there is searching for your document. Share knowledge with a global audience of 90M+ and counting.
            </p>

          {/* Drag & Drop Area */}
          <div
            className={`${styles["drop-zone"]} ${isDragging ? styles["drop-zone-active"] : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className={styles["file-input"]}
            />
              <div className={styles["drop-zone-content"]}>
                <FileText className={styles["drop-zone-icon"]} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles["btn-select-documents"]}
                >
                  Select documents to upload
                </button>
                <p className={styles["drop-zone-text"]}>or drag & drop</p>
              </div>
            </div>

          {/* Supported File Types */}
          <p className={styles["supported-files"]}>
            Supported file types: PDF, DOCX
          </p>

            {/* Uploader Agreement */}
            <p className={styles["uploader-agreement"]}>
              By uploading, you agree to our{" "}
              <a href="#" className={styles["agreement-link"]} onClick={(e) => e.preventDefault()}>
                Uploader Agreement
              </a>
            </p>

            {/* Intellectual Property Notice */}
            <div className={styles["ip-notice"]}>
              <p className={styles["ip-text"]}>
                Scribd is committed to protecting intellectual property and adheres to the Digital Millennium Copyright Act (DMCA) and other applicable laws. 
                We have a three-strikes policy for repeat infringers. If you believe your content has been used without authorization, please contact us.
              </p>
            </div>

            {/* Footer Icons */}
            <div className={styles["footer-icons"]}>
              <div className={styles["footer-icon"]}>
                <Upload className={styles["icon"]} />
              </div>
              <div className={styles["footer-icon"]}>
                <FileText className={styles["icon"]} />
              </div>
              <div className={styles["footer-icon"]}>
                <FileText className={styles["icon"]} />
              </div>
              <div className={styles["footer-icon"]}>
                <FileText className={styles["icon"]} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && fileSelected && (
        <div className={styles["card"]}>
          {/* Change File Button */}
          <div className={styles["change-file-section"]}>
            <button
              type="button"
              onClick={resetForm}
              className={styles["btn-change-file"]}
            >
              <X className="w-4 h-4" />
              Change File
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles["form"]}>
            {/* Two Column Layout */}
            <div className={styles["two-column-layout"]}>
              {/* Left Column - Document Preview */}
              <div className={styles["preview-column"]}>
                <div className={styles["preview-card"]}>
                  <div className={styles["preview-label"]}>
                    {fileType === "application/pdf" ? "PDF" : getFileTypeName(fileType)}
                  </div>
                  {filePreview && fileType === "application/pdf" ? (
                    <div className={styles["preview-content"]}>
                      {pdfError ? (
                        <div className={styles["preview-fallback"]}>
                          <FileText className={styles["preview-icon"]} />
                          <p className={styles["preview-text"]}>
                            {pdfError}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className={styles["preview-pdf-wrapper"]}>
                            <Document
                              file={file}
                              onLoadSuccess={({ numPages }) => {
                                setNumPages(numPages);
                                setPdfError(null);
                              }}
                              onLoadError={(error) => {
                                console.error("PDF load error:", error);
                                setPdfError("Failed to load PDF preview. Please try downloading the file instead.");
                              }}
                              loading={
                                <div className={styles["preview-loading"]}>
                                  Loading PDF preview...
                                </div>
                              }
                              error={
                                <div className={styles["preview-fallback"]}>
                                  <FileText className={styles["preview-icon"]} />
                                  <p className={styles["preview-text"]}>
                                    Failed to load PDF preview
                                  </p>
                                </div>
                              }
                            >
                              <Page
                                pageNumber={1}
                                width={400}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                              />
                            </Document>
                          </div>
                          {numPages && numPages > 1 && (
                            <div className={styles["preview-page-info"]}>
                              Page 1 of {numPages}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : docxHtml && fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                    <div className={styles["preview-content"]}>
                      {docxError ? (
                        <div className={styles["preview-fallback"]}>
                          <FileText className={styles["preview-icon"]} />
                          <p className={styles["preview-text"]}>
                            {docxError}
                          </p>
                        </div>
                      ) : (
                        <div className={styles["preview-docx-wrapper"]}>
                          <div 
                            className={styles["preview-docx-content"]}
                            dangerouslySetInnerHTML={{ __html: docxHtml }}
                          />
                        </div>
                      )}
                    </div>
                  ) : file && fileType === "application/msword" ? (
                    // DOC files - no preview available, show file info only
                    <div className={styles["preview-placeholder"]}>
                      <FileText className={styles["preview-icon"]} />
                      <p className={styles["preview-text"]}>Preview not available for DOC files</p>
                      <div className={styles["preview-file-info"]}>
                        <p className={styles["preview-file-type"]}>
                          Type: {getFileTypeName(fileType)}
                        </p>
                        <p className={styles["preview-file-size"]}>
                          Size: {formatFileSize(fileSize)}
                        </p>
                      </div>
                    </div>
                  ) : file ? (
                    // Other file types - show file info
                    <div className={styles["preview-placeholder"]}>
                      <FileText className={styles["preview-icon"]} />
                      <p className={styles["preview-text"]}>Document Preview</p>
                      <div className={styles["preview-file-info"]}>
                        <p className={styles["preview-file-type"]}>
                          Type: {getFileTypeName(fileType)}
                        </p>
                        <p className={styles["preview-file-size"]}>
                          Size: {formatFileSize(fileSize)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles["preview-placeholder"]}>
                      <FileText className={styles["preview-icon"]} />
                      <p className={styles["preview-text"]}>No file selected</p>
                    </div>
                  )}
                  {fileName && (
                    <div className={styles["preview-filename"]}>{fileName}</div>
                  )}
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className={styles["form-column"]}>
                {/* Title */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Title <span className={styles["required"]}>*</span>
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title"
                    maxLength={40}
                    className={`${styles["input"]} ${errors.title ? styles["input-error"] : ""}`}
                  />
                  <div className={styles["field-help"]}>
                    <p className={styles["help-text"]}>
                      Imagine you&apos;re searching for this document. What keywords would you use to find it?
                    </p>
                    <span className={styles["char-counter"]}>
                      {title.length}/40
                    </span>
                  </div>
                  {errors.title && (
                    <p className={styles["field-error"]}>{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Description <span className={styles["required"]}>*</span>
                  </label>
                  <textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a quick summary: What is this document about? Where did it originate? Who might find this information useful? What are the key highlights?"
                    rows={4}
                    maxLength={100}
                    className={`${styles["textarea"]} ${errors.description ? styles["input-error"] : ""}`}
                  />
                  <div className={styles["field-help"]}>
                    <p className={styles["help-text"]}>
                      Your description should be a few sentences long.
                    </p>
                    <span className={styles["char-counter"]}>
                      {description.length}/100
                    </span>
                  </div>
                  {errors.description && (
                    <p className={styles["field-error"]}>{errors.description}</p>
                  )}
                </div>

                {/* Document Type */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Type <span className={styles["required"]}>*</span>
                  </label>
                  <select
                    ref={typeIdRef}
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className={`${styles["select"]} ${errors.typeId ? styles["input-error"] : ""}`}
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.typeId && (
                    <p className={styles["field-error"]}>{errors.typeId}</p>
                  )}
                </div>

                {/* Domain Dropdown */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Domain <span className={styles["required"]}>*</span>
                  </label>
                  <select
                    ref={domainRef}
                    value={selectedDomainId}
                    onChange={(e) => handleDomainChange(e.target.value)}
                    className={`${styles["select"]} ${errors.domain ? styles["input-error"] : ""}`}
                  >
                    <option value="">Select domain</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  {errors.domain && (
                    <p className={styles["field-error"]}>{errors.domain}</p>
                  )}
                </div>

                {/* Specialization Dropdown */}
                {selectedDomainId && (
                  <div className={styles["field-group"]}>
                    <label className={styles["field-label"]}>
                      Specialization <span className={styles["required"]}>*</span>
                    </label>
                    <select
                      value={selectedSpecializationId}
                      onChange={(e) => setSelectedSpecializationId(e.target.value)}
                      className={`${styles["select"]} ${errors.specialization ? styles["input-error"] : ""}`}
                    >
                      <option value="">Select specialization</option>
                      {specializations.length > 0 ? (
                        specializations.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No specializations available
                        </option>
                      )}
                    </select>
                    {errors.specialization && (
                      <p className={styles["field-error"]}>{errors.specialization}</p>
                    )}
                  </div>
                )}

                {/* Visibility */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Public / Internal <span className={styles["required"]}>*</span>
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      handleVisibilityChange(e.target.value as "PUBLIC" | "INTERNAL")
                    }
                    className={`${styles["select"]} ${errors.visibility ? styles["input-error"] : ""}`}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="INTERNAL">Internal</option>
                  </select>
                  {errors.visibility && (
                    <p className={styles["field-error"]}>{errors.visibility}</p>
                  )}
                </div>

                {/* Organization Selection for Internal Documents */}
                {visibility === "INTERNAL" && (
                  <div className={styles["field-group"]}>
                    <label className={styles["field-label"]}>
                      Organization <span className={styles["required"]}>*</span>
                    </label>
                    {organizations.length === 0 ? (
                      <div className={styles["field-error"]}>
                        You must be a member of at least one organization to upload internal documents.
                      </div>
                    ) : (
                      <>
                        <div className={styles["org-selection-grid"]}>
                          {organizations.map((org) => {
                            const hasLogoError = orgLogoErrors.has(org.id);
                            const logoUrl = org.logo && !hasLogoError 
                              ? sanitizeImageUrl(org.logo, LOGO_BASE_URL, null)
                              : null;
                            const isSelected = selectedOrganizationId === org.id;
                            
                            return (
                              <div
                                key={org.id}
                                className={`${styles["org-selection-card"]} ${isSelected ? styles["org-selection-card-selected"] : ""}`}
                                onClick={() => setSelectedOrganizationId(org.id)}
                              >
                                <div className={styles["org-selection-logo-wrapper"]}>
                                  {logoUrl ? (
                                    <img
                                      src={logoUrl}
                                      alt={`${org.name} logo`}
                                      className={styles["org-selection-logo"]}
                                      onError={() => handleOrgLogoError(org.id)}
                                    />
                                  ) : (
                                    <div className={styles["org-selection-logo-fallback"]}>
                                      <Building2 className={styles["org-selection-logo-icon"]} />
                                    </div>
                                  )}
                                  {isSelected && (
                                    <div className={styles["org-selection-check"]}>
                                      <Check className={styles["org-selection-check-icon"]} />
                                    </div>
                                  )}
                                </div>
                                <div className={styles["org-selection-name"]}>
                                  {org.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {errors.organization && (
                          <p className={styles["field-error"]}>{errors.organization}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tags Multi-select with Combobox */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Tags (optional)</label>
                  <div className={styles["tags-wrapper"]} ref={tagDropdownRef}>
                    {/* Search input */}
                    <div className={styles["tag-search-wrapper"]}>
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onFocus={() => setShowTagDropdown(true)}
                        placeholder="Search or add new tag"
                        className={styles["tag-search-input"]}
                      />
                      {showTagDropdown && tags.length > 0 && (
                        <div className={styles["tag-dropdown"]}>
                          {tags
                            .filter(
                              (tag) =>
                                !selectedTagIds.includes(tag.id) &&
                                tag.name.toLowerCase().includes(tagSearch.toLowerCase())
                            )
                            .map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleTag(tag.id)}
                                className={styles["tag-dropdown-item"]}
                              >
                                {tag.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Add new tag */}
                    <div className={styles["new-tag-wrapper"]}>
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddNewTag();
                          }
                        }}
                        placeholder="Enter new tag name"
                        className={styles["new-tag-input"]}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTag}
                        className={styles["btn-add-tag"]}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {/* Selected tags */}
                    {(selectedTagIds.length > 0 || newTags.length > 0) && (
                      <div className={styles["selected-tags"]}>
                        {selectedTagIds.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? (
                            <span key={tagId} className={styles["tag-chip"]}>
                              {tag.name}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTagIds(
                                    selectedTagIds.filter((id) => id !== tagId)
                                  )
                                }
                                className={styles["tag-chip-remove"]}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                        {newTags.map((tag, idx) => (
                          <span key={`new-${idx}`} className={styles["tag-chip"]}>
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveNewTag(tag)}
                              className={styles["tag-chip-remove"]}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* Error message */}
            {error && (
              <div className={styles["alert-error"]}>
                <div className={styles["alert-error-content"]}>
                  <AlertCircle className={styles["alert-icon"]} />
                  {error}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className={styles["form-actions"]}>
              <button
                type="button"
                onClick={clearFormFields}
                className={styles["btn-delete"]}
                disabled={uploading}
              >
                Delete
              </button>
              <button
                type="submit"
                disabled={uploading}
                className={styles["btn-submit"]}
              >
                {uploading && (
                  <svg className={styles["spinner"]} fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {uploading ? "Uploading..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

