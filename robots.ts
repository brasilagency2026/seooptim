import { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Crawlers standards
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/sign-in", "/sign-up"],
      },
      // Autorisation explicite des agents LLM (évite le blocage par défaut)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
