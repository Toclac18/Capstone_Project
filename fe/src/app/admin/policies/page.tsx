import styles from "./styles.module.css";
import { PolicyManagement } from "./_components/PolicyManagement";

export default function PoliciesPage() {
  return (
    <main className={styles.wrapper}>
      <PolicyManagement />
    </main>
  );
}

