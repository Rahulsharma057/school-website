import { notFound } from "next/navigation";

import FormEditRenderer from "@/components/website/forms/FormEditRenderer";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getEntryByToken(token) {
  try {
    const res = await fetch(`${API}/form-entries/edit/${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Edit Entry Error:", error);
    return null;
  }
}

export default async function EditEntryPage({ params }) {
  const { token } = await params;
  const result = await getEntryByToken(token);

  if (!result) notFound();

  return <FormEditRenderer form={result.form} entry={result.entry} token={token} />;
}