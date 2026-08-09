import { getSitemapData } from "@/services/customPageService";

// NOTE: set this to your real production domain (used as the base for
// every URL in the sitemap — required, can't be relative).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

/**
 * Next.js's native sitemap support (App Router): a `sitemap.js` file at
 * the app root automatically serves a real /sitemap.xml — no extra
 * route/config needed, this function just needs to return the URL list.
 *
 * Includes every published (`status: true`) custom page. If you want
 * News articles in here too, add a matching `getSitemapData`-style
 * endpoint to the news module and merge its results below — say so and
 * I'll wire it up.
 */
export default async function sitemap() {
  const staticEntries = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  let pageEntries = [];

  try {
    const { data } = await getSitemapData();
    pageEntries = (data?.data || []).map((page) => ({
      url: `${SITE_URL}${page.route}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // If the API is unreachable at build time, ship the static entries
    // rather than failing the whole sitemap/build.
  }

  return [...staticEntries, ...pageEntries];
}
