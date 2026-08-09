import { notFound } from "next/navigation";

import DynamicPageContent from "@/components/admin/custom-pages/DynamicPageContent";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getPage(slug) {
  if (!slug || !API) {
    return null;
  }

  try {
    const res = await fetch(
      `${API}/custom-pages/public/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      console.log("Page not found:", slug);

      return null;
    }

    const json = await res.json();

    return json?.data || null;
  } catch (error) {
    console.log("Dynamic Page Fetch Error:", error.message);

    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const page = await getPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.seoTitle || page.title,

    description: page.seoDescription || page.shortDescription || "",

    keywords: Array.isArray(page.keywords) ? page.keywords.join(", ") : "",

    openGraph: {
      title: page.seoTitle || page.title,

      description: page.seoDescription || page.shortDescription || "",

      images: page.coverImage?.url
        ? [
            {
              url: page.coverImage.url,

              width: page.coverImage.width || 1200,

              height: page.coverImage.height || 500,

              alt: page.coverImage.alt || page.title,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",

      title: page.title,

      description: page.shortDescription || "",

      images: page.coverImage?.url ? [page.coverImage.url] : [],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return <DynamicPageContent page={page} />;
}
