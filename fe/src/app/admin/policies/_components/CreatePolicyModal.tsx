"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { PolicyEditor } from "./PolicyEditor";
import { createPolicy, getAllPolicies } from "@/services/policyService";
import { useToast, toast } from "@/components/ui/toast";
import type { CreatePolicyRequest } from "@/types/policy";
import styles from "./styles.module.css";

interface CreatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  version: string;
  title: string;
  content: string;
};

export function CreatePolicyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePolicyModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>();

  const content = watch("content");
  const version = watch("version");

  // Load existing versions when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadVersions = async () => {
        try {
          const policies = await getAllPolicies();
          const versions = policies.map(p => p.version.toLowerCase().trim());
          setExistingVersions(versions);
        } catch (e) {
          console.error("Failed to load existing versions", e);
        }
      };
      loadVersions();
      reset({
        version: "",
        title: "Term of User",
        content: "",
      });
      setVersionError(null);
    }
  }, [isOpen, reset]);

  // Validate version on change
  useEffect(() => {
    if (version && version.trim()) {
      const trimmedVersion = version.trim().toLowerCase();
      if (existingVersions.includes(trimmedVersion)) {
        setVersionError("This version already exists. Please use a different version.");
        setError("version", {
          type: "manual",
          message: "This version already exists. Please use a different version.",
        });
      } else {
        setVersionError(null);
        clearErrors("version");
      }
    } else {
      setVersionError(null);
    }
  }, [version, existingVersions, setError, clearErrors]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const onSubmit = async (data: FormData) => {
    if (!data.content || data.content.trim() === "" || data.content === "<p><br></p>") {
      showToast(toast.error("Error", "Content is required"));
      return;
    }

    if (!data.version || data.version.trim() === "") {
      showToast(toast.error("Error", "Version is required"));
      return;
    }

    // Check version duplicate one more time before submit
    const trimmedVersion = data.version.trim().toLowerCase();
    if (existingVersions.includes(trimmedVersion)) {
      setVersionError("This version already exists. Please use a different version.");
      setError("version", {
        type: "manual",
        message: "This version already exists. Please use a different version.",
      });
      return;
    }

    setLoading(true);
    try {
      const request: CreatePolicyRequest = {
        version: data.version.trim(),
        title: data.title?.trim() || "Term of User",
        content: data.content || "",
      };

      await createPolicy(request);
      showToast(toast.success("Success", "Policy version created successfully"));
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to create policy";
      
      // Check if error is about duplicate version
      if (errorMessage.toLowerCase().includes("version") && errorMessage.toLowerCase().includes("exists")) {
        setVersionError(errorMessage);
        setError("version", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        showToast(toast.error("Error", errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Create New Policy Version</h2>
            <p className={styles.modalSubtitle}>
              Create a new version of Term of User policy
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={loading}
          >
            <X className={styles.modalCloseIcon} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Version <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              {...register("version", { 
                required: "Version is required",
                pattern: {
                  value: /^[a-zA-Z0-9._-]+$/,
                  message: "Version can only contain letters, numbers, dots, dashes, and underscores"
                }
              })}
              className={`${styles.input} ${errors.version || versionError ? styles.inputError : ""}`}
              placeholder="e.g., 1.0, 2.0, v1, v2"
              disabled={loading}
            />
            {(errors.version || versionError) && (
              <span className={styles.errorMessage}>
                {errors.version?.message || versionError}
              </span>
            )}
            <p className={styles.helperText}>
              Version identifier (e.g., &quot;1.0&quot;, &quot;2.0&quot;, &quot;v1&quot;, &quot;v2&quot;). This cannot be changed later.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              {...register("title", { required: "Title is required" })}
              className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
              placeholder="Enter policy title"
              disabled={loading}
            />
            {errors.title && (
              <span className={styles.errorMessage}>{errors.title.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Content <span className={styles.required}>*</span>
            </label>
            <PolicyEditor
              value={content}
              onChange={(value) => setValue("content", value, { shouldValidate: true })}
              error={errors.content?.message}
              disabled={loading}
            />
            {errors.content && (
              <span className={styles.errorMessage}>{errors.content.message}</span>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Policy Version"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

