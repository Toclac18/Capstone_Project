"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  fetchDocumentTypes,
  fetchTags,
  fetchSpecializations,
  type DocumentType,
  type Tag,
  type Specialization,
} from "@/app/reader/upload-document/api";
import { fetchOrganizations } from "@/app/reader/organizations/api";
import type { OrganizationSummary } from "@/app/reader/organizations/api";
import type { LibraryDocument } from "@/services/library.service";
import styles from "../styles.module.css";

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateDocumentData) => Promise<void>;
  document: LibraryDocument;
}

export type UpdateDocumentData = {
  title: string;
  description: string;
  visibility: "PUBLIC" | "INTERNAL";
  typeId: string;
  domainId: string;
  specializationId: string;
  tagIds: string[];
  newTags?: string[];
  organizationId?: string;
};

export default function EditDocumentModal({
  isOpen,
  onClose,
  onSave,
  document,
}: EditDocumentModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [title, setTitle] = useState(document.documentName);
  const [description, setDescription] = useState(document.description || "");
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL">(
    document.visibility === "PRIVATE" ? "PUBLIC" : document.visibility,
  );
  const [organizationId, setOrganizationId] = useState<string>("");
  const [typeId, setTypeId] = useState("");
  const [domainId, setDomainId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  // Options
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const tagsInputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagsInputWrapperRef.current &&
        !tagsInputWrapperRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      window.document.addEventListener("mousedown", handleClickOutside);
      return () => {
        window.document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showTagDropdown]);

  useEffect(() => {
    if (isOpen) {
      // Reset form with document data
      setTitle(document.documentName);
      setDescription(document.description || "");
      setVisibility(
        document.visibility === "PRIVATE" ? "PUBLIC" : document.visibility,
      );
      setOrganizationId(document.organizationId || "");
      setSelectedTagIds(document.tagIds || []);
      setNewTags([]);
      setNewTagInput("");
      setTagSearch("");
      setShowTagDropdown(false);
      setError(null);
      setErrors({});
      setTypeId("");
      setDomainId("");
      setSpecializationId("");
      setSpecializations([]);
      loadOptions();
    }
  }, [isOpen, document]);

  const loadOptions = async () => {
    try {
      const [types, tagsData, orgsData] = await Promise.all([
        fetchDocumentTypes(),
        fetchTags(),
        fetchOrganizations(),
      ]);
      setDocumentTypes(types);
      setTags(tagsData);
      setOrganizations(orgsData.items);

      // Find matching type by name
      const matchedType = types.find((t) => t.name === document.type);
      if (matchedType) {
        setTypeId(matchedType.id);
      } else {
        // If type not found, set to first type as fallback
        if (types.length > 0) {
          setTypeId(types[0].id);
        }
      }

      // Find domain ID from document.domain by fetching domains once
      // We need domain ID to load specializations
      const domainsResponse = await fetch("/api/reader/documents/domains");
      const domainsData = await domainsResponse.json();
      const matchedDomain = domainsData.find(
        (d: { name: string; id: string }) => d.name === document.domain,
      );

      if (matchedDomain) {
        setDomainId(matchedDomain.id);

        // Load specializations based on matched domain
        const specs = await fetchSpecializations([matchedDomain.id]);
        setSpecializations(specs);

        // Pre-select specialization from document if exists
        if (document.specializationId) {
          const matchedSpec = specs.find(
            (s) => s.id === document.specializationId,
          );
          if (matchedSpec) {
            setSpecializationId(document.specializationId);
          } else {
            // If specialization not found in list, reset to empty
            setSpecializationId("");
          }
        } else {
          // If document has no specializationId, reset to empty
          setSpecializationId("");
        }
      } else {
        // If domain not found, reset everything
        setDomainId("");
        setSpecializations([]);
        setSpecializationId("");
      }

      // Set selected tags from document (after tags are loaded)
      if (document.tagIds && document.tagIds.length > 0) {
        setSelectedTagIds(document.tagIds);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load options";
      setError(msg);
      showToast({
        type: "error",
        title: "Load Failed",
        message: msg,
        duration: 5000,
      });
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleAddNewTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;

    // Check if tag already exists in tags list
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === tag.toLowerCase(),
    );
    if (existingTag) {
      // If tag exists, add its ID to selectedTagIds instead
      if (!selectedTagIds.includes(existingTag.id)) {
        setSelectedTagIds([...selectedTagIds, existingTag.id]);
      }
    } else if (!newTags.includes(tag)) {
      // If tag doesn't exist, add to newTags (will be created on save)
      setNewTags([...newTags, tag]);
    }
    setNewTagInput("");
  };

  const handleRemoveNewTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
    setShowTagDropdown(false);
    setTagSearch("");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
      if (titleRef.current) {
        titleRef.current.focus();
      }
    } else if (title.trim().length > 40) {
      newErrors.title = "Title must be 40 characters or less";
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      if (descriptionRef.current && !titleRef.current) {
        descriptionRef.current.focus();
      }
    } else if (description.trim().length > 100) {
      newErrors.description = "Description must be 100 characters or less";
      if (descriptionRef.current && !titleRef.current) {
        descriptionRef.current.focus();
      }
    }

    if (!typeId) {
      newErrors.typeId = "Type is required";
    }

    if (!domainId) {
      newErrors.domainId = "Domain is required";
    }

    if (!specializationId) {
      newErrors.specializationId = "Specialization is required";
    }

    if (visibility === "INTERNAL") {
      if (!organizationId) {
        newErrors.organizationId =
          "Organization is required when visibility is Internal";
      } else if (organizations.length === 0) {
        newErrors.organizationId =
          "You must be a member of at least one organization to set visibility as Internal";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast({
          type: "error",
          title: "Validation Error",
          message: firstError,
          duration: 5000,
        });
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updateData: UpdateDocumentData = {
        title: title.trim(),
        description: description.trim(),
        visibility,
        typeId,
        domainId,
        specializationId,
        tagIds: selectedTagIds,
        newTags: newTags.length > 0 ? newTags : undefined,
        organizationId:
          visibility === "INTERNAL" && organizationId
            ? organizationId
            : undefined,
      };

      await onSave(updateData);
      showToast({
        type: "success",
        title: "Success",
        message: "Document updated successfully.",
        duration: 3000,
      });
      // Parent handles modal close after data refresh
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Unable to update document. Please try again later.";
      setError(msg);
      // Error toast is shown by parent
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTags = useMemo(
    () =>
      tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
          !selectedTagIds.includes(tag.id),
      ),
    [tags, tagSearch, selectedTagIds],
  );

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles["edit-modal-overlay"]}>
      <div className={styles["edit-modal-backdrop"]} onClick={handleClose} />
      <div className={styles["edit-modal-container"]}>
        <div className={styles["edit-modal-header"]}>
          <h3 className={styles["edit-modal-title"]}>Edit Document</h3>
          <button
            onClick={handleClose}
            className={styles["edit-modal-close-btn"]}
            disabled={isLoading}
          >
            <X className={styles["edit-modal-close-icon"]} />
          </button>
        </div>

        <div className={styles["edit-modal-body"]}>
          {error && (
            <div className={styles["edit-error-alert"]}>
              <AlertCircle className={styles["edit-error-icon"]} />
              <p>{error}</p>
            </div>
          )}

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>
              Title <span className={styles["edit-required"]}>*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors({ ...errors, title: "" });
                }
              }}
              className={`${styles["edit-form-input"]} ${errors.title ? styles["edit-input-error"] : ""}`}
              placeholder="Enter document title"
              disabled={isLoading}
              maxLength={40}
            />
            {errors.title && (
              <span className={styles["edit-error-message"]}>
                {errors.title}
              </span>
            )}
          </div>

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>
              Description <span className={styles["edit-required"]}>*</span>
            </label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors({ ...errors, description: "" });
                }
              }}
              className={`${styles["edit-form-textarea"]} ${errors.description ? styles["edit-input-error"] : ""}`}
              placeholder="Enter document description"
              disabled={isLoading}
              rows={4}
              maxLength={100}
            />
            {errors.description && (
              <span className={styles["edit-error-message"]}>
                {errors.description}
              </span>
            )}
          </div>

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>
              Visibility <span className={styles["edit-required"]}>*</span>
            </label>
            <div className={styles["edit-radio-group"]}>
              <label className={styles["edit-radio-label"]}>
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC"
                  checked={visibility === "PUBLIC"}
                  onChange={(e) => {
                    setVisibility(e.target.value as "PUBLIC");
                    setOrganizationId("");
                    if (errors.organizationId) {
                      setErrors({ ...errors, organizationId: "" });
                    }
                  }}
                  disabled={isLoading}
                  className={styles["edit-radio-input"]}
                />
                <span>Public</span>
              </label>
              <label className={styles["edit-radio-label"]}>
                <input
                  type="radio"
                  name="visibility"
                  value="INTERNAL"
                  checked={visibility === "INTERNAL"}
                  onChange={(e) => setVisibility(e.target.value as "INTERNAL")}
                  disabled={isLoading}
                  className={styles["edit-radio-input"]}
                />
                <span>Internal</span>
              </label>
            </div>
          </div>

          {visibility === "INTERNAL" && (
            <div className={styles["edit-form-group"]}>
              <label className={styles["edit-form-label"]}>
                Organization <span className={styles["edit-required"]}>*</span>
              </label>
              {organizations.length === 0 ? (
                <div className={styles["edit-error-message"]}>
                  You must be a member of at least one organization to set
                  visibility as Internal.
                </div>
              ) : (
                <>
                  <select
                    value={organizationId}
                    onChange={(e) => {
                      setOrganizationId(e.target.value);
                      if (errors.organizationId) {
                        setErrors({ ...errors, organizationId: "" });
                      }
                    }}
                    className={`${styles["edit-form-select"]} ${errors.organizationId ? styles["edit-input-error"] : ""}`}
                    disabled={isLoading}
                  >
                    <option value="">Select organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {errors.organizationId && (
                    <span className={styles["edit-error-message"]}>
                      {errors.organizationId}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>
              Type <span className={styles["edit-required"]}>*</span>
            </label>
            <select
              value={typeId}
              onChange={(e) => {
                setTypeId(e.target.value);
                if (errors.typeId) {
                  setErrors({ ...errors, typeId: "" });
                }
              }}
              className={`${styles["edit-form-select"]} ${errors.typeId ? styles["edit-input-error"] : ""}`}
              disabled={isLoading}
            >
              <option value="">Select type</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.typeId && (
              <span className={styles["edit-error-message"]}>
                {errors.typeId}
              </span>
            )}
          </div>

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>Domain</label>
            <input
              type="text"
              value={document.domain}
              className={`${styles["edit-form-input"]} cursor-not-allowed bg-gray-100 dark:bg-gray-700`}
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Domain cannot be changed. Please select a specialization within
              this domain.
            </p>
          </div>

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>
              Specialization <span className={styles["edit-required"]}>*</span>
            </label>
            <select
              value={specializationId}
              onChange={(e) => {
                setSpecializationId(e.target.value);
                if (errors.specializationId) {
                  setErrors({ ...errors, specializationId: "" });
                }
              }}
              className={`${styles["edit-form-select"]} ${errors.specializationId ? styles["edit-input-error"] : ""}`}
              disabled={isLoading || specializations.length === 0}
            >
              <option value="">Select specialization</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
            {errors.specializationId && (
              <span className={styles["edit-error-message"]}>
                {errors.specializationId}
              </span>
            )}
          </div>

          <div className={styles["edit-form-group"]}>
            <label className={styles["edit-form-label"]}>Tags</label>
            <div className={styles["edit-tags-container"]}>
              {/* Search tags input */}
              <div
                className={styles["edit-tags-input-wrapper"]}
                ref={tagsInputWrapperRef}
              >
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => {
                    setTagSearch(e.target.value);
                    setShowTagDropdown(true);
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  className={styles["edit-form-input"]}
                  placeholder="Search or add tags"
                  disabled={isLoading}
                />
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className={styles["edit-tags-dropdown"]}>
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={styles["edit-tag-option"]}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new tag input - between search and selected tags */}
              <div className={styles["edit-new-tag-input"]}>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                  className={styles["edit-form-input"]}
                  placeholder="Add new tag"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className={styles["edit-btn-add-tag"]}
                  disabled={isLoading || !newTagInput.trim()}
                >
                  <Plus className={styles["edit-btn-icon"]} />
                </button>
              </div>

              {/* Selected tags display */}
              <div className={styles["edit-selected-tags"]}>
                {selectedTagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  return tag ? (
                    <span key={tagId} className={styles["edit-tag-chip"]}>
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tagId)}
                        className={styles["edit-tag-remove"]}
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                {newTags.map((tag, idx) => (
                  <span
                    key={`new-${idx}`}
                    className={styles["edit-tag-chip-new"]}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveNewTag(tag)}
                      className={styles["edit-tag-remove"]}
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles["edit-modal-actions"]}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={styles["edit-btn-cancel"]}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={styles["edit-btn-save"]}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
