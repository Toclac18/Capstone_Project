"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  postJSON,
  type ContactAdminResponse,
  type ContactAdminPayload,
} from "./api";
import styles from "./styles.module.css";

const CATEGORIES = [
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "PAYMENT", label: "Payment" },
  { value: "ACCESS", label: "Access Problem" },
  { value: "CONTENT", label: "Content" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
] as const;

const URGENCY_LEVELS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
] as const;

type FormValues = {
  name: string;
  email: string;
  category: (typeof CATEGORIES)[number]["value"];
  otherCategory?: string;
  urgency: (typeof URGENCY_LEVELS)[number]["value"];
  subject: string;
  message: string;
};

export default function ContactAdminForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      category: "TECHNICAL",
      urgency: "NORMAL",
      subject: "",
      message: "",
      otherCategory: "",
    },
  });

  const selectedCategory = watch("category");
  const isOther = selectedCategory === "OTHER";

  useEffect(() => {
    if (!isOther) {
      setValue("otherCategory", "");
      clearErrors("otherCategory");
    }
  }, [isOther, setValue, clearErrors]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<ContactAdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload: ContactAdminPayload = {
      name: data.name,
      email: data.email,
      category: data.category,
      otherCategory: data.otherCategory,
      urgency: data.urgency,
      subject: data.subject,
      message: data.message,
    };

    try {
      const [resp] = await Promise.all([
        postJSON(payload),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      setSuccess(resp);
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit ticket");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles["form-container"]}>
        <div className={styles["success-card"]}>
          <div className={styles["success-icon-wrapper"]}>
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={styles["success-title"]}>Ticket Submitted!</h2>
          <p className={styles["success-message"]}>{success.message}</p>
          <div className={styles["ticket-info"]}>
            <span className={styles["ticket-label"]}>Ticket Code:</span>
            <span className={styles["ticket-code"]}>{success.ticketCode}</span>
          </div>
          <p className={styles["success-note"]}>
            Save this code to track your ticket status.
          </p>
          <button
            onClick={() => setSuccess(null)}
            className={styles["form-submit-btn"]}
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles["form-container"]}>
      <div className={styles["form-header"]}>
        <h2 className={styles["form-title"]}>Contact Support</h2>
        <p className={styles["form-subtitle"]}>
          We&apos;re here to help. Fill out the form below and we&apos;ll get back to you soon.
        </p>
      </div>

      {error && (
        <div className={styles["form-alert-error"]}>{error}</div>
      )}

      {/* Contact Info */}
      <div className={styles["form-section"]}>
        <h3 className={styles["form-section-header"]}>Contact Information</h3>
        <div className={styles["form-grid"]}>
          <div className={styles["form-field-group"]}>
            <label htmlFor="name" className={styles["form-label"]}>
              Full Name
            </label>
            <input
              id="name"
              className={`${styles["form-input"]} ${errors.name ? styles.error : ""}`}
              placeholder="Enter your name"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
            {errors.name && (
              <p className={styles["form-error-message"]}>{errors.name.message}</p>
            )}
          </div>

          <div className={styles["form-field-group"]}>
            <label htmlFor="email" className={styles["form-label"]}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`${styles["form-input"]} ${errors.email ? styles.error : ""}`}
              placeholder="your@email.com"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
              })}
            />
            {errors.email && (
              <p className={styles["form-error-message"]}>{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Issue Details */}
      <div className={styles["form-section"]}>
        <h3 className={styles["form-section-header"]}>Issue Details</h3>
        
        <div className={styles["form-grid"]}>
          {/* Category Dropdown */}
          <div className={styles["form-field-group"]}>
            <label htmlFor="category" className={styles["form-label"]}>
              Category
            </label>
            <select
              id="category"
              className={`${styles["form-select"]} ${errors.category ? styles.error : ""}`}
              {...register("category", { required: "Select a category" })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className={styles["form-error-message"]}>{errors.category.message}</p>
            )}
          </div>

          {/* Urgency Dropdown */}
          <div className={styles["form-field-group"]}>
            <label htmlFor="urgency" className={styles["form-label"]}>
              Priority
            </label>
            <select
              id="urgency"
              className={`${styles["form-select"]} ${errors.urgency ? styles.error : ""}`}
              {...register("urgency", { required: "Select priority" })}
            >
              {URGENCY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.urgency && (
              <p className={styles["form-error-message"]}>{errors.urgency.message}</p>
            )}
          </div>
        </div>

        {isOther && (
          <div className={styles["form-field-group"]}>
            <label htmlFor="otherCategory" className={styles["form-label"]}>
              Please specify
            </label>
            <input
              id="otherCategory"
              className={`${styles["form-input"]} ${errors.otherCategory ? styles.error : ""}`}
              placeholder="Describe your issue type"
              {...register("otherCategory", {
                required: "Please specify",
                minLength: { value: 3, message: "At least 3 characters" },
              })}
            />
            {errors.otherCategory && (
              <p className={styles["form-error-message"]}>{errors.otherCategory.message}</p>
            )}
          </div>
        )}

        {/* Subject */}
        <div className={styles["form-field-group"]}>
          <label htmlFor="subject" className={styles["form-label"]}>
            Subject
          </label>
          <input
            id="subject"
            className={`${styles["form-input"]} ${errors.subject ? styles.error : ""}`}
            placeholder="Brief description of your issue"
            {...register("subject", {
              required: "Subject is required",
              minLength: { value: 3, message: "At least 3 characters" },
            })}
          />
          {errors.subject && (
            <p className={styles["form-error-message"]}>{errors.subject.message}</p>
          )}
        </div>

        {/* Message */}
        <div className={styles["form-field-group"]}>
          <label htmlFor="message" className={styles["form-label"]}>
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            className={`${styles["form-textarea"]} ${errors.message ? styles.error : ""}`}
            placeholder="Describe your issue in detail..."
            {...register("message", {
              required: "Message is required",
              minLength: { value: 10, message: "At least 10 characters" },
            })}
          />
          {errors.message && (
            <p className={styles["form-error-message"]}>{errors.message.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={styles["form-submit-btn"]}
      >
        {loading ? (
          <span className={styles["btn-loading"]}>
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Ticket"
        )}
      </button>
    </form>
  );
}
