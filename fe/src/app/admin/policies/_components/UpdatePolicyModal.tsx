"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { PolicyEditor } from "./PolicyEditor";
import { updatePolicy } from "@/services/policyService";
import { useToast, toast } from "@/components/ui/toast";
import type { Policy, UpdatePolicyRequest } from "@/types/policy";
import styles from "./styles.module.css";

interface UpdatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  policy: Policy | null;
}

type FormData = {
  title: string;
  content: string;
};

export function UpdatePolicyModal({
  isOpen,
  onClose,
  onSuccess,
  policy,
}: UpdatePolicyModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const content = watch("content");

  useEffect(() => {
    if (policy && isOpen) {
      reset({
        title: policy.title,
        content: policy.content,
      });
    }
  }, [policy, isOpen, reset]);

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
    if (!policy) return;

    // Validate that at least title or content is provided
    const hasTitle = data.title && data.title.trim() !== "";
    const hasContent = data.content && data.content.trim() !== "" && data.content !== "<p><br></p>";
    
    if (!hasTitle && !hasContent) {
      showToast(toast.error("Error", "At least title or content must be provided"));
      return;
    }

    if (!hasContent) {
      showToast(toast.error("Error", "Content is required"));
      return;
    }

    setLoading(true);
    try {
      // Ensure we don't send empty strings
      const request: UpdatePolicyRequest = {
        title: hasTitle ? data.title.trim() : undefined,
        content: hasContent ? data.content : undefined,
      };

      await updatePolicy(policy.id, request);
      
      if (policy.isActive) {
        showToast(toast.warning(
          "Policy Updated", 
          "Active policy has been updated. This will affect users during registration."
        ));
      } else {
        showToast(toast.success("Success", "Policy updated successfully"));
      }
      
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update policy";
      showToast(toast.error("Error", errorMessage));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !policy) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Edit Policy</h2>
            <p className={styles.modalSubtitle}>
              Version {policy.version} {policy.isActive && "(Active)"}
            </p>
            {policy.isActive && (
              <p className={styles.warningText}>
                ⚠️ This policy is currently active. Changes will affect users during registration.
              </p>
            )}
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
              Version
            </label>
            <input
              type="text"
              value={policy.version}
              className={styles.input}
              disabled
            />
            <p className={styles.helperText}>
              Version cannot be changed after creation.
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
              {loading ? "Saving..." : "Update Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

