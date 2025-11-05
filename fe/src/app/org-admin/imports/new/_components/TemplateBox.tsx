"use client";
import React from "react";
import s from "../styles.module.css";

export default function TemplateBox() {
  return (
    <div className={s.help}>
      <div className="font-medium mb-1">Expected columns (sheet 1):</div>
      <ol className="list-decimal ml-5 space-y-1">
        <li>fullName</li>
        <li>username</li>
        <li>email</li>
      </ol>
      <a className="underline" href="/templates/import_users_template.xlsx">Download template</a>
    </div>
  );
}
