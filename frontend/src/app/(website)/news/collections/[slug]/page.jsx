import { notFound } from "next/navigation";
import NewsGrid from "@/components/website/news/NewsGrid";

const API = process.env.NEXT_PUBLIC_API_URL;

// Registered at /news/collections/[slug] rather than /news/[slug] on
// purpose — article detail pages already own /news/[slug], and a News
// Section's slug could otherwise collide with a real article's slug.
async function getSection(slug) {
  try {
    const res = await fetch(`${API}/news-sections/public/${slug}`, { cache: "no-store" });

    if (!res.ok) return null;

    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get News Section Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) return {};

  return {
    title: section.title,
    description: section.description || "",
  };
}

export default async function NewsSectionPage({ params }) {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) notFound();

  return <NewsGrid slug={slug} detailMode="link" />;
}
