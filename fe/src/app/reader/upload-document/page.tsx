"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, AlertCircle, Plus, FileText } from "lucide-react";
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
import styles from "./styles.module.css";

export default function UploadDocumentPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const typeIdRef = useRef<HTMLSelectElement>(null);
  const domainRef = useRef<HTMLSelectElement>(null);

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
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL" | "PRIVATE">("PUBLIC");
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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [types, domainsData, tagsData] = await Promise.all([
          fetchDocumentTypes(),
          fetchDomains(),
          fetchTags(),
        ]);
        setDocumentTypes(types);
        setDomains(domainsData);
        setTags(tagsData);
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

    // Validate file type (PDF, DOC, DOCX, etc.)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrors({
        ...errors,
        file: "Please upload a PDF or Word document",
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
    
    // Generate preview for PDF (store as data URL)
    if (selectedFile.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFilePreview(result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For DOC/DOCX, we'll show file info instead
      setFilePreview(null);
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

    // Validate file type (PDF, DOC, DOCX only)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(droppedFile.type)) {
      setErrors({
        ...errors,
        file: "Please upload a PDF or Word document (PDF, DOC, DOCX)",
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
    
    // Generate preview for PDF (store as data URL)
    if (droppedFile.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFilePreview(result);
      };
      reader.readAsDataURL(droppedFile);
    } else {
      // For DOC/DOCX, we'll show file info instead
      setFilePreview(null);
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
        newTags: newTags.length > 0 ? newTags : undefined,
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

      {error && !loading && (
        <div className={styles["error-container"]}>{error}</div>
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
              accept=".pdf,.doc,.docx"
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
            Supported file types: PDF, DOC, DOCX
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
                      <object
                        data={filePreview}
                        type="application/pdf"
                        className={styles["preview-object"]}
                        title="PDF Preview"
                      >
                        <div className={styles["preview-fallback"]}>
                          <FileText className={styles["preview-icon"]} />
                          <p className={styles["preview-text"]}>
                            Your browser doesn&apos;t support PDF preview.
                          </p>
                        </div>
                      </object>
                    </div>
                  ) : file ? (
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
                      className={`${styles["select"]} ${errors.domain ? styles["input-error"] : ""}`}
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
                  </div>
                )}

                {/* Visibility */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Public / Internal / Private <span className={styles["required"]}>*</span>
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as "PUBLIC" | "INTERNAL" | "PRIVATE")
                    }
                    className={styles["select"]}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="INTERNAL">Internal</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>

                {/* Tags Multi-select with Combobox */}
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Tags (optional)</label>
                  <div className={styles["tags-wrapper"]}>
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

