"use client";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { TagManagement } from "./_components/TagManagement";

export default function TagsPage() {
  return (
    <>
      <Breadcrumb pageName="Tag Management" />
      <TagManagement />
    </>
  );
}

