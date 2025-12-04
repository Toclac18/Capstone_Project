import type { ReactNode } from "react";
import styles from "../styles.module.css";

type Props = {
  title: string;
  children: ReactNode;
};

export function TicketSection({ title, children }: Props) {
  return (
    <section className={styles["ticket-card"]}>
      <h2 className={styles["ticket-section-title"]}>{title}</h2>
      {children}
    </section>
  );
}
