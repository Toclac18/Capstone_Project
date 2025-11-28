"use client";

import styles from "../styles.module.css";
import { useTicketDetail } from "../provider";
import { TicketStatusBadge } from "./TicketStatusBadge";

export function TicketDetailView() {
  const { ticket, isLoading, error, reload } = useTicketDetail();

  if (isLoading) {
    return (
      <div className={styles["ticket-page"]}>
        <div className={styles["ticket-card-unified"]}>
          <p className={styles["ticket-subtitle"]}>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["ticket-page"]}>
        <div className={styles["ticket-card-unified"]}>
          <div className={styles["form-alert-error"]}>{error}</div>
          <div className={styles["ticket-actions-row"]}>
            <button
              type="button"
              className={styles["ticket-reload-btn"]}
              onClick={reload}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles["ticket-page"]}>
        <div className={styles["ticket-card-unified"]}>
          <p className={styles["ticket-empty-text"]}>Ticket not found.</p>
        </div>
      </div>
    );
  }

  const createdAt = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleString()
    : "-";
  const updatedAt = ticket.updatedAt
    ? new Date(ticket.updatedAt).toLocaleString()
    : "-";

  return (
    <div className={styles["ticket-page"]}>
      <article className={styles["ticket-card-unified"]}>
        {/* HEADER */}
        <header className={styles["ticket-header-row"]}>
          <div className={styles["ticket-title-block"]}>
            <h1 className={styles["ticket-main-title"]}>{ticket.subject}</h1>

            <div className={styles["ticket-code-chip"]}>
              <span>Ticket code</span>
              <code>{ticket.ticketCode}</code>
            </div>
          </div>

          <TicketStatusBadge status={ticket.status} />
        </header>

        {/* META (same card) */}
        <section className={styles["ticket-section-block"]}>
          <div className={styles["ticket-meta-grid"]}>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>Urgency</span>
              <span className={styles["ticket-meta-value"]}>
                {ticket.urgency || "Normal"}
              </span>
            </div>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>Category</span>
              <span className={styles["ticket-meta-value"]}>
                {ticket.category}
              </span>
            </div>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>Created at</span>
              <span className={styles["ticket-meta-value"]}>{createdAt}</span>
            </div>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>Last update</span>
              <span className={styles["ticket-meta-value"]}>{updatedAt}</span>
            </div>
          </div>
        </section>

        {/* REQUESTER */}
        <section className={styles["ticket-section-block"]}>
          <h2 className={styles["ticket-section-title"]}>
            Requester information
          </h2>
          <div className={styles["ticket-meta-grid"]}>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>Name</span>
              <span className={styles["ticket-meta-value"]}>{ticket.name}</span>
            </div>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>Email</span>
              <span className={styles["ticket-meta-value"]}>
                {ticket.email}
              </span>
            </div>
            <div className={styles["ticket-meta-row"]}>
              <span className={styles["ticket-meta-label"]}>IP address</span>
              <span className={styles["ticket-meta-value"]}>
                {ticket.ipAddress || "-"}
              </span>
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        <section className={styles["ticket-section-block"]}>
          <h2 className={styles["ticket-section-title"]}>Message</h2>
          <div className={styles["ticket-message"]}>{ticket.message}</div>
          {ticket.otherCategory && (
            <div className={styles["ticket-actions-row"]}>
              <span>
                Other category: <strong>{ticket.otherCategory}</strong>
              </span>
            </div>
          )}
        </section>

        {/* ADMIN NOTES */}
        <section className={styles["ticket-section-block"]}>
          <h2 className={styles["ticket-section-title"]}>Admin notes</h2>
          {ticket.adminNotes ? (
            <div className={styles["ticket-message"]}>{ticket.adminNotes}</div>
          ) : (
            <p className={styles["ticket-empty-text"]}>No admin notes yet.</p>
          )}
        </section>
      </article>
    </div>
  );
}
