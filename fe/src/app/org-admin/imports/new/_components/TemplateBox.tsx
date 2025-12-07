"use client";
import s from "../styles.module.css";

export default function TemplateBox() {
  return (
    <div className={s.help}>
      <div className="mb-1 font-medium">
        Your uploaded file must have the correct template
      </div>
      <a className="underline" href="/import_example.xlsx" download>
        Download template
      </a>
    </div>
  );
}
