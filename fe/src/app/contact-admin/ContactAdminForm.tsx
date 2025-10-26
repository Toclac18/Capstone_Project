// src/app/contact-admin/ContactAdminForm.tsx
"use client";

import { useState } from "react";
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
const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

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
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      category: "TECHNICAL",
      urgency: "MEDIUM",
      subject: "",
      message: "",
      otherCategory: "",
    },
  });

  const isOther = watch("category") === "OTHER";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<ContactAdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Payload đúng với BE (enum); otherCategory sẽ được xử lý ở service.
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["form-container"]}
    >
      <h2 className={styles["form-title"]}>Submit a Support Ticket</h2>

      {success && (
        <div className={styles["form-alert-success"]}>
          Ticket created successfully! ID: {success.ticketId} — Code:{" "}
          {success.ticketCode}
          <p className="mt-1">{success.message}</p>
        </div>
      )}
      {error && <div className={styles["form-alert-error"]}>{error}</div>}

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
          {errors.name && (
            <p className={styles["form-error-message"]}>
              {errors.name.message}
            </p>
          )}
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
          {errors.email && (
            <p className={styles["form-error-message"]}>
              {errors.email.message}
            </p>
          )}
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
          {errors.category && (
            <p className={styles["form-error-message"]}>
              {errors.category.message}
            </p>
          )}
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
          {errors.urgency && (
            <p className={styles["form-error-message"]}>
              {errors.urgency.message}
            </p>
          )}
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
          {errors.otherCategory && (
            <p className={styles["form-error-message"]}>
              {errors.otherCategory.message}
            </p>
          )}
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
        {errors.subject && (
          <p className={styles["form-error-message"]}>
            {errors.subject.message}
          </p>
        )}
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
        {errors.message && (
          <p className={styles["form-error-message"]}>
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div />
        <button
          type="submit"
          disabled={loading}
          className={styles["form-submit-btn"]}
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>

      <p className={styles["form-meta-text"]}>
        API endpoint (via FE):{" "}
        <code className={styles["form-code-block"]}>
          POST /api/contact-admin
        </code>
      </p>
    </form>
  );
}
