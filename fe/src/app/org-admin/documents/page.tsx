"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import DocumentProvider from "./provider";
import { DocumentManagement } from "./_components/DocumentManagement";

export default function OrgDocumentsPage() {
  return (
    <DocumentProvider>
      <main className="px-4 py-8">
        <Breadcrumb pageName="Document Management" />
        <DocumentManagement />
      </main>
    </DocumentProvider>
  );
}
