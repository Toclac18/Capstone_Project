"use client";
import { FileSpreadsheet, Download } from "lucide-react";
import s from "../styles.module.css";

export default function TemplateBox() {
  return (
    <div className={s.help}>
      <div className={s.helpIcon}>
        <FileSpreadsheet size={24} />
      </div>
      <div className={s.helpContent}>
        <div className={s.helpTitle}>Download Template First</div>
        <p className={s.helpText}>
          Your uploaded file must follow the correct format. Download our template to ensure compatibility.
        </p>
      </div>
      <a className={s.helpLink} href="/import_example.xlsx" download>
        <Download size={16} />
        Download Template
      </a>
    </div>
  );
}
