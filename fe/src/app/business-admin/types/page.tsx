"use client";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { TypeManagement } from "./_components/TypeManagement";

export default function TypesPage() {
  return (
    <>
      <Breadcrumb pageName="Type Management" />
      <TypeManagement />
    </>
  );
}

