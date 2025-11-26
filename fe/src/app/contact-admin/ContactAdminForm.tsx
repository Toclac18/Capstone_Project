// src/app/contact-admin/ContactAdminForm.tsx
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
  "PAYMENT",
  "ACCESS",
  "CONTENT",
  "TECHNICAL",
  "ACCOUNT",
  "OTHER",
] as const;
const URGENCY_LEVELS = ["LOW", "NORMAL", "HIGH"] as const;

type FormValues = {
  name: string;
  email: string;
  category: (typeof CATEGORIES)[number];
  otherCategory?: string;
  urgency: (typeof URGENCY_LEVELS)[number];
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

  const isOther = watch("category") === "OTHER";

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
      const resp = await postJSON(payload);
      setSuccess(resp);
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit ticket");
    } finally {
      setLoading(false);
    }
  };

  // Always render a line under each field; if no error, render NBSP
  const errorTextOrSpacer = (msg?: string) => (msg ? msg : "\u00A0");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["form-container"]}
    >
      <h2 className={styles["form-title"]}>Submit a Support Ticket</h2>

      {success && (
        <div className="w-full">
          <div className={styles["form-alert-success"]}>
            Ticket created successfully!
            <p className="mt-1">{success.message}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="w-full">
          <div className={styles["form-alert-error"]}>{error}</div>
        </div>
      )}

      <h3 className={styles["form-section-header"]}>Your Contact Details</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={styles["form-field-group"]}>
          <label htmlFor="name" className={styles["form-label"]}>
            Full Name *
          </label>
          <input
            id="name"
            className={`${styles["form-input"]} ${errors.name ? styles.error : ""}`}
            placeholder="John Doe"
            {...register("name", {
              required: "Your name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
            aria-invalid={!!errors.name}
          />
          <p className={styles["form-error-message"]}>
            {errorTextOrSpacer(errors.name?.message)}
          </p>
        </div>

        <div className={styles["form-field-group"]}>
          <label htmlFor="email" className={styles["form-label"]}>
            Email *
          </label>
          <input
            id="email"
            type="email"
            className={`${styles["form-input"]} ${errors.email ? styles.error : ""}`}
            placeholder="john@example.com"
            {...register("email", {
              required: "Your email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Please enter a valid email address",
              },
            })}
            aria-invalid={!!errors.email}
          />
          <p className={styles["form-error-message"]}>
            {errorTextOrSpacer(errors.email?.message)}
          </p>
        </div>
      </div>

      <h3 className={styles["form-section-header"]}>Issue Details</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={styles["form-field-group"]}>
          <label htmlFor="category" className={styles["form-label"]}>
            Category *
          </label>
          <select
            id="category"
            className={`${styles["form-select"]} ${errors.category ? styles.error : ""}`}
            {...register("category", { required: "Please select a category" })}
            aria-invalid={!!errors.category}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <p className={styles["form-error-message"]}>
            {errorTextOrSpacer(errors.category?.message)}
          </p>
        </div>

        <div className={styles["form-field-group"]}>
          <label htmlFor="urgency" className={styles["form-label"]}>
            Urgency *
          </label>
          <select
            id="urgency"
            className={`${styles["form-select"]} ${errors.urgency ? styles.error : ""}`}
            {...register("urgency", {
              required: "Please select an urgency level",
            })}
            aria-invalid={!!errors.urgency}
          >
            {URGENCY_LEVELS.map((u) => (
              <option key={u} value={u}>
                {u.charAt(0) + u.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <p className={styles["form-error-message"]}>
            {errorTextOrSpacer(errors.urgency?.message)}
          </p>
        </div>
      </div>

      {isOther && (
        <div className={styles["form-field-group"]}>
          <label htmlFor="otherCategory" className={styles["form-label"]}>
            Please specify *
          </label>
          <input
            id="otherCategory"
            className={`${styles["form-input"]} ${errors.otherCategory ? styles.error : ""}`}
            placeholder="Describe your issue type (e.g., Partnership, Feedback...)"
            {...register("otherCategory", {
              required: "Please specify your issue type",
              minLength: { value: 3, message: "Must be at least 3 characters" },
            })}
            aria-invalid={!!errors.otherCategory}
          />
          <p className={styles["form-error-message"]}>
            {errorTextOrSpacer(errors.otherCategory?.message)}
          </p>
        </div>
      )}

      <div className={styles["form-field-group"]}>
        <label htmlFor="subject" className={styles["form-label"]}>
          Subject *
        </label>
        <input
          id="subject"
          className={`${styles["form-input"]} ${errors.subject ? styles.error : ""}`}
          placeholder="Briefly describe your issue"
          {...register("subject", {
            required: "Subject is required",
            minLength: {
              value: 3,
              message: "Subject must be at least 3 characters",
            },
          })}
          aria-invalid={!!errors.subject}
        />
        <p className={styles["form-error-message"]}>
          {errorTextOrSpacer(errors.subject?.message)}
        </p>
      </div>

      <div className={styles["form-field-group"]}>
        <label htmlFor="message" className={styles["form-label"]}>
          Message *
        </label>
        <textarea
          id="message"
          rows={6}
          className={`${styles["form-textarea"]} ${errors.message ? styles.error : ""}`}
          placeholder="Provide detailed information about your issue..."
          {...register("message", {
            required: "Message is required",
            minLength: {
              value: 10,
              message: "Message must be at least 10 characters",
            },
          })}
          aria-invalid={!!errors.message}
        />
        <p className={styles["form-error-message"]}>
          {errorTextOrSpacer(errors.message?.message)}
        </p>
      </div>

      {/* Centered submit area */}
      <div className={styles["form-actions"]}>
        <button
          type="submit"
          disabled={loading}
          className={styles["form-submit-btn"]}
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>
    </form>
  );
}
