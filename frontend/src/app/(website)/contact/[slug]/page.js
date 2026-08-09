import { notFound } from "next/navigation";

import ContactPageRenderer from "@/components/website/contact/ContactPageRenderer";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getContactPage(slug) {
  try {
    const res = await fetch(`${API}/contact-pages/public/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Contact Page Error:", error);
    return null;
  }
}

// The linked Form is fetched separately via the existing public form
// endpoint — decoupled from ContactPage, and each response stays small
// and independently cacheable.
async function getContactForm(formSlug) {
  if (!formSlug) return null;
  try {
    const res = await fetch(`${API}/forms/public/${formSlug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Contact Form Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getContactPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.subtitle || "" };
}

export default async function ContactPage({ params }) {
  const { slug } = await params;
  const page = await getContactPage(slug);

  if (!page) notFound();

  const contactForm = await getContactForm(page.contactFormSlug);

  return <ContactPageRenderer page={page} contactForm={contactForm} />;
}