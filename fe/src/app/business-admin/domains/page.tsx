"use client";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { DomainManagement } from "./_components/DomainManagement";

export default function DomainsPage() {
  return (
    <>
      <Breadcrumb pageName="Domain Management" />
      <DomainManagement />
    </>
  );
}

