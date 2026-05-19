import { MetadataRoute } from "next";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchQuery(api.posts.getAllPublished);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt
      ? new Date(post.updatedAt)
      : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...postEntries,
  ];
}
