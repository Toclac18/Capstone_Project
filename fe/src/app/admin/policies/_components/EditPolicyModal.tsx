"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { PolicyEditor } from "./PolicyEditor";
import { updatePolicyByType } from "@/services/policyService";
import { useToast, toast } from "@/components/ui/toast";
import type { Policy, UpdatePolicyRequest, PolicyStatus } from "@/types/policy";
import styles from "./styles.module.css";

const STATUS_OPTIONS: { value: PolicyStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

interface EditPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  policy: Policy | null;
}

type FormData = {
  title: string;
  content: string;
  status: PolicyStatus;
  isRequired: boolean;
};

export function EditPolicyModal({
  isOpen,
  onClose,
  onSuccess,
  policy,
}: EditPolicyModalProps) {
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
        status: policy.status as PolicyStatus,
        isRequired: policy.isRequired,
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

    if (!data.content || data.content.trim() === "" || data.content === "<p><br></p>") {
      showToast(toast.error("Error", "Content is required"));
      return;
    }

    setLoading(true);
    try {
      const request: UpdatePolicyRequest = {
        title: data.title,
        content: data.content,
        status: data.status,
        isRequired: data.isRequired,
      };

      await updatePolicyByType(policy.type, request);
      showToast(toast.success("Success", "Policy updated successfully"));
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

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Edit Policy</h2>
            <p className={styles.modalSubtitle}>
              {policy.title}
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Status <span className={styles.required}>*</span>
              </label>
              <select
                {...register("status", { required: "Status is required" })}
                className={`${styles.select} ${errors.status ? styles.inputError : ""}`}
                disabled={loading}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <span className={styles.errorMessage}>{errors.status.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  {...register("isRequired")}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <span>Required for users to accept</span>
              </label>
            </div>
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
