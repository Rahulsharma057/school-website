import GalleryFullView from "@/components/website/gallery/GalleryFullView";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getGallery(slug) {
  try {
    const res = await fetch(`${API}/galleries/public/${slug}`, { cache: "no-store" });

    if (!res.ok) return null;

    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Gallery Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) return {};

  return {
    title: gallery.title,
    description: gallery.description || gallery.subheading || "",
  };
}

export default async function PublicGalleryPage({ params }) {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  return <GalleryFullView slug={slug} initialGallery={gallery} />;
}
