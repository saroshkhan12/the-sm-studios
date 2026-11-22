import type { MetadataRoute } from "next";
import { collections } from "@/data/catalog";
import { readEtsyProducts } from "@/lib/etsy";

export const dynamic = "force-dynamic";

const siteUrl = "https://smstudios.khansproduction.pk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/collections", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/shipping", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/returns", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/cancellations", priority: 0.3, changeFrequency: "monthly" as const },
  ];

  const staticEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${siteUrl}/collections/${collection.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await readEtsyProducts();
    productEntries = products.map((product) => ({
      url: `${siteUrl}/shop/${encodeURIComponent(product.slug)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Keep the sitemap available when the Etsy catalog service is temporarily unavailable.
  }

  return [...staticEntries, ...collectionEntries, ...productEntries];
}
