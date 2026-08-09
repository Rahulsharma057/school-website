"use client";

import { useParams } from "next/navigation";

import DynamicFormTable from "@/components/admin/custom-forms/DynamicFormTable";

export default function AdminDynamicTablePage() {
  const { tableSlug } = useParams();

  return <DynamicFormTable tableSlug={tableSlug} />;
}