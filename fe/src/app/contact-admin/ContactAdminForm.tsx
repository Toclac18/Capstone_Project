"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { postJSON, type ContactAdminResponse } from "./api";
import styles from "./styles.module.css";

// BE enum mapping
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
  otherCategory?: string; // only when category = OTHER
  urgency: (typeof URGENCY_LEVELS)[number];
  subject: string;
  message: string;
};

export default function ContactAdminForm() {
  // TODO: thay bằng token thật từ state/context
  const TEMP_AUTH_TOKEN = "YOUR_JWT_TOKEN_HERE";

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
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

  const categoryValue = watch("category");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<ContactAdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!TEMP_AUTH_TOKEN || TEMP_AUTH_TOKEN === "YOUR_JWT_TOKEN_HERE") {
      setError("Missing or placeholder auth token. Please log in first.");
      return;
    }

    // Merge otherCategory if category = OTHER
    const payload = {
      ...data,
      category:
        data.category === "OTHER" && data.otherCategory
          ? `OTHER: ${data.otherCategory}`
          : data.category,
    };

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const resp = await postJSON<ContactAdminResponse>(
        "/contact/admin",
        payload,
        TEMP_AUTH_TOKEN,
      );
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
          <p className="mt-1 text-emerald-700">{success.message}</p>
        </div>
      )}
      {error && <div className={styles["form-alert-error"]}>{error}</div>}

      <h3 className={styles["form-section-header"]}>Your Contact Details</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={styles["form-field-group"]}>
          <label className={styles["form-label"]}>Full Name *</label>
          <input
            className={`${styles["form-input"]} ${errors.name ? styles.error : ""}`}
            placeholder="John Doe"
            {...register("name", {
              required: "Your name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
          />
          {errors.name && (
            <p className={styles["form-error-message"]}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div className={styles["form-field-group"]}>
          <label className={styles["form-label"]}>Email *</label>
          <input
            type="email"
            className={`${styles["form-input"]} ${errors.email ? styles.error : ""}`}
            placeholder="john@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Enter a valid email address",
              },
            })}
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
          <label className={styles["form-label"]}>Category *</label>
          <select
            className={`${styles["form-select"]} ${errors.category ? styles.error : ""}`}
            {...register("category", { required: "Please select a category" })}
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
          <label className={styles["form-label"]}>Urgency *</label>
          <select
            className={`${styles["form-select"]} ${errors.urgency ? styles.error : ""}`}
            {...register("urgency", {
              required: "Please select urgency level",
            })}
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

      {categoryValue === "OTHER" && (
        <div className={styles["form-field-group"]}>
          <label className={styles["form-label"]}>Please specify *</label>
          <input
            className={`${styles["form-input"]} ${errors.otherCategory ? styles.error : ""}`}
            placeholder="Describe the category"
            {...register("otherCategory", {
              required: "Please specify a category when choosing OTHER",
              minLength: {
                value: 3,
                message: "At least 3 characters required",
              },
            })}
          />
          {errors.otherCategory && (
            <p className={styles["form-error-message"]}>
              {errors.otherCategory.message}
            </p>
          )}
        </div>
      )}

      <div className={styles["form-field-group"]}>
        <label className={styles["form-label"]}>Subject *</label>
        <input
          className={`${styles["form-input"]} ${errors.subject ? styles.error : ""}`}
          placeholder="Brief issue summary (e.g., 'Login not working')"
          {...register("subject", {
            required: "Subject is required",
            minLength: { value: 3, message: "At least 3 characters" },
          })}
        />
        {errors.subject && (
          <p className={styles["form-error-message"]}>
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className={styles["form-field-group"]}>
        <label className={styles["form-label"]}>Message *</label>
        <textarea
          rows={6}
          className={`${styles["form-textarea"]} ${errors.message ? styles.error : ""}`}
          placeholder="Describe your issue in detail, including steps to reproduce."
          {...register("message", {
            required: "Message is required",
            minLength: {
              value: 10,
              message: "Message must be at least 10 characters",
            },
          })}
        />
        {errors.message && (
          <p className={styles["form-error-message"]}>
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={styles["form-submit-btn"]}
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>

      <p className={styles["form-meta-text"]}>
        API endpoint: <code>POST /contact/admin</code>
      </p>
    </form>
  );
}
