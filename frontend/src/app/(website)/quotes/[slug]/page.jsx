import { notFound } from "next/navigation";
import QuoteWall from "@/components/website/quotes/QuoteWall";

const API = process.env.NEXT_PUBLIC_API_URL;

// Only needed here for generateMetadata (page <title>/description have
// to be resolved server-side before the page ever reaches the browser)
// and for the notFound() check on a bad slug — the actual quotes and
// layout are fetched by <QuoteWall slug={slug} /> itself, client-side,
// same as everywhere else this component is used.
async function getSection(slug) {
  try {
    const res = await fetch(`${API}/quote-sections/public/${slug}`, { cache: "no-store" });

    if (!res.ok) return null;

    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Quote Section Error:", error);
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

export default async function QuoteSectionPage({ params }) {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) notFound();

  return <QuoteWall slug={slug} />;
}
