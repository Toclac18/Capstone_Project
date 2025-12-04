// src/app/org-admin/imports/[id]/_components/DetailClient.tsx
"use client";

import PageHeader from "./PageHeader";
import MetaGrid from "./MetaGrid";
import ResultTable from "./ResultTable";
import s from "../styles.module.css";
import { useImportDetail } from "../provider";

export default function DetailClient() {
  const { loading } = useImportDetail();

  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <PageHeader />

        {loading ? (
          <div className={s.loading}>Loading import detail…</div>
        ) : (
          <>
            <MetaGrid />
            <ResultTable />
          </>
        )}
      </div>
    </div>
  );
}
