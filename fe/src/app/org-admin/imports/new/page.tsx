import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import styles from "./styles.module.css";
import TemplateBox from "./_components/TemplateBox";
import UploadForm from "./_components/UploadForm";
import UploadProvider from "./provider";

export default function Page() {
  return (
    <main className={styles.wrapper}>
      <Link href="/org-admin/imports" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Import History
      </Link>
      
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Upload size={20} />
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.headerTitle}>Import Readers</h1>
          <p className={styles.headerSubtitle}>
            Upload an Excel file to add readers to your organization
          </p>
        </div>
      </header>

      <UploadProvider>
        <TemplateBox />
        <UploadForm />
      </UploadProvider>
    </main>
  );
}