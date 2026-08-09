import { notFound } from "next/navigation";
import FormRenderer from "@/components/website/forms/FormRenderer";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getForm(slug) {
  try {
    const res = await fetch(`${API}/forms/public/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Form Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) return {};
  return { title: form.title, description: form.description || "" };
}

export default async function PublicFormPage({ params }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) notFound();
  return <FormRenderer form={form} />;
}