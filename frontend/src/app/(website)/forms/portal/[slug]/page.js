import { notFound } from "next/navigation";

import EditPortal from "@/components/website/forms/EditPortal";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getFormMeta(slug) {
  try {
    const res = await fetch(`${API}/forms/public/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const form = await getFormMeta(slug);
  if (!form) return {};
  return { title: `Edit — ${form.title}` };
}

export default async function EditPortalPage({ params }) {
  const { slug } = await params;
  const form = await getFormMeta(slug);

  if (!form) notFound();

  return <EditPortal formTitle={form.title} formSlug={slug} />;
}