// src/app/org-admin/imports/[id]/page.tsx
import { use } from "react";
import ImportDetailProvider from "./provider";
import DetailClient from "./_components/DetailClient";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ImportDetailProvider id={id}>
      <DetailClient />
    </ImportDetailProvider>
  );
}
