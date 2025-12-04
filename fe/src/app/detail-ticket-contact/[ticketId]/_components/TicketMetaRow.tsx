import type { ReactNode } from "react";
import styles from "../styles.module.css";

type Props = {
  label: string;
  value?: ReactNode;
};

export function TicketMetaRow({ label, value }: Props) {
  return (
    <div className={styles["ticket-meta-row"]}>
      <span className={styles["ticket-meta-label"]}>{label}</span>
      <span className={styles["ticket-meta-value"]}>
        {value ?? <span className={styles["ticket-empty-text"]}>N/A</span>}
      </span>
    </div>
  );
}
